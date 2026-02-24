import pandas as pd
from sqlalchemy import create_engine, text
import os
import re

DB_URL = "postgresql://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE"

def clean_column_name(name):
    clean = str(name).replace('.', '_').replace(' ', '_').lower()
    clean = re.sub(r'[^a-z0-9_]', '', clean)
    return clean

def import_file(file_path, table_name, engine):
    print(f"\nEvaluating: {os.path.basename(file_path)}...")
    try:
        if file_path.endswith('.parquet'):
            df = pd.read_parquet(file_path)
        else:
            try:
                df = pd.read_csv(file_path, low_memory=False, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, low_memory=False, encoding='latin1')
    except Exception as e:
        print(f"  [X] Pipeline Error loading file: {e}")
        return False
    
    # Clean Column Names explicitly for PostgreSQL compatibility
    df.columns = [clean_column_name(c) for c in df.columns]
    
    print(f"  --> Processing {len(df)} rows into Azure PostgreSQL as '{table_name}'")
    try:
        df.to_sql(table_name, engine, if_exists='replace', index=False, chunksize=5000)
        return True
    except Exception as e:
        print(f"  [X] Failed SQL transaction: {e}")
        return False

def main():
    print("--- INITIATING STRIDE AZURE DATABASE MIGRATION PROTOCOL ---")
    engine = create_engine(DB_URL)
    dataset_dir = os.path.join(os.path.dirname(__file__), '..', 'datasets')
    
    # STRIDE Schema Map Definitions
    tasks = [
        # 1. Core Geo mapping and Identity
        ('School-Unique-48k.csv', 'dim_school_unique_48k'),
        ('School-Level-v2.parquet', 'raw_school_level_v2'),
        ('School-Unique-v2.parquet', 'raw_school_unique_v2'),
        ('RegProv.Congestion.csv', 'dim_regprov_congestion'),
        
        # 2. GMIS Human Resources
        ('GMIS-FillingUpPerPosition-Oct2025.csv', 'dim_gmis_filling_up'),
        ('SDOFill.parquet', 'dim_sdo_fill'),
        ('2025-Third Level Officials DepEd-cleaned.csv', 'dim_third_level_officials'),
        
        # 3. EFD Infrastructure Datasets
        ('EFD-DataBuilder-2025.csv', 'dim_efd_databuilder_2025'),
        ('EFD-ProgramsList-Aug2025.csv', 'dim_efd_programs_list'),
        ('EFD-Masterlist.parquet', 'fact_efd_masterlist'),
        ('EFD-LMS-GIDCA-NSBI2023.parquet', 'dim_efd_lms_gidca'),
        ('Buildable_LatLong.csv', 'dim_buildable_latlong'),
        
        # 4. Special Analytics: Distance, Industry, Private
        ('SHS-Industry.parquet', 'dim_shs_industry'),
        ('IndDistance.ALL2.parquet', 'fact_industry_distance_matrix'),
        ('Private Schools Oct.2025.csv', 'dim_private_schools_oct2025'),
        
        # 5. Cloud Matrix pre-aggregations
        ('Cloud_Consolidated.parquet', 'raw_cloud_v1'),
        ('Cloud_Consolidated_v2.parquet', 'raw_cloud_v2'),
        ('Cloud_Consolidated_v3.parquet', 'raw_cloud_v3'),
        
        # 6. Pipeline Additions
        ('DBM-Proposal.csv', 'dim_dbm_proposal')
    ]
    
    successful_files = []

    for filename, table in tasks:
        path = os.path.join(dataset_dir, filename)
        if os.path.exists(path):
            if import_file(path, table, engine):
                successful_files.append(path)
        else:
            print(f"File {filename} not found locally, skipping mapping block.")

    print("\n--- Applying DDL Post-Migration Pipeline (Primary Keys, Views, GIS) ---")
    with engine.begin() as conn:
        print(">> Extension Setup: Validating PostGIS...")
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        except Exception as e:
            print(f"   Warning: PostGIS installation skipped. Assumed inactive or unprivileged. Error: {e}")
        
        print(">> Architecture: Primary Indexing SchoolID for Dim_Schools...")
        try:
            conn.execute(text("ALTER TABLE dim_school_unique_48k ADD PRIMARY KEY (schoolid)"))
        except Exception as e:
             print(f"   Notice: PK modification skipped (Table might contain duplicate references). Error: {e}")
             
        try:
            print(">> Architecture: Injecting PostGIS Geometry Layer for 48k Mapping Engine...")
            conn.execute(text("ALTER TABLE dim_school_unique_48k ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326)"))
            conn.execute(text("UPDATE dim_school_unique_48k SET geom = ST_SetSRID(ST_MakePoint(CAST(longitude AS DOUBLE PRECISION), CAST(latitude AS DOUBLE PRECISION)), 4326) WHERE longitude IS NOT NULL AND latitude IS NOT NULL AND longitude != '' AND latitude != ''"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_dim_school_unique_48k_geom ON dim_school_unique_48k USING GIST (geom)"))
        except Exception as e:
            print(f"   Warning: PostGIS spatial integration failed on coordinates. Error: {e}")

        print(">> Architecture: Fusing Centralized Dim_Schools Materialized View...")
        try:
            conn.execute(text("""
                CREATE OR REPLACE VIEW dim_schools AS 
                SELECT 
                    s48.*
                FROM dim_school_unique_48k s48
            """))
        except Exception as e:
             print(f"   Warning: View creation failed. Error: {e}")

        print(">> Indexing: Enforcing Speed Dropdowns for GMIS...")
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_dim_gmis_position ON dim_gmis_filling_up (position)"))
        except Exception as e:
            print(f"   Warning: GMIS index creation failed. Error: {e}")

        print(">> Normalization: Bridging Fact_Infrastructure_Projects relation...")
        try:
            conn.execute(text("""
                CREATE OR REPLACE VIEW fact_infrastructure_projects AS
                SELECT *
                FROM fact_efd_masterlist
            """))
        except Exception as e:
             print(f"   Warning: EFD bridging failed. Error: {e}")

        print(">> Materialization: Baking High-Speed Cloud Views...")
        for ver in ['1', '2', '3']:
            mv_name = f"mv_cloud_consolidated_v{ver}"
            raw_name = f"raw_cloud_v{ver}"
            try:
                conn.execute(text(f"DROP MATERIALIZED VIEW IF EXISTS {mv_name}"))
                conn.execute(text(f"CREATE MATERIALIZED VIEW {mv_name} AS SELECT * FROM {raw_name}"))
            except Exception as e:
                 print(f"   Warning: Materialized View computation skipped/failed for Cloud v{ver}. Error: {e}")

    print("\n--- Executing Zero-Trust Deletion Protocol ---")
    deleted_count = 0
    for path in successful_files:
        try:
           os.remove(path)
           deleted_count += 1
           print(f"DELETED FROM LOCAL STORAGE: {os.path.basename(path)}")
        except Exception as e:
           print(f"Removal block blocked for {path}: {e}")
           
    print(f"\n--- MISSION COMPLETE. ---")
    print(f"TOTAL MIGRATION AND CLEARED FLAT FILES: {deleted_count}")

if __name__ == "__main__":
    main()
