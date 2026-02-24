import pandas as pd
from sqlalchemy import create_engine
import os
import re

# Database connection string from .env
DB_URL = "postgresql://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE"

def clean_column_name(name):
    # PostgreSQL prefers lowercase, no dots, no spaces
    clean = name.replace('.', '_').replace(' ', '_').lower()
    # Remove any other non-alphanumeric chars (except underscore)
    clean = re.sub(r'[^a-z0-9_]', '', clean)
    return clean

def import_csv(file_path, table_name, engine):
    print(f"Reading {file_path}...")
    try:
        df = pd.read_csv(file_path, low_memory=False, encoding='utf-8')
    except UnicodeDecodeError:
        print("UTF-8 fail, trying latin1...")
        df = pd.read_csv(file_path, low_memory=False, encoding='latin1')
    
    # Clean column names
    original_cols = df.columns
    new_cols = [clean_column_name(c) for c in original_cols]
    df.columns = new_cols
    
    print(f"Importing to table '{table_name}' ({len(df)} rows)...")
    # if_exists='replace' will drop the table if it exists
    df.to_sql(table_name, engine, if_exists='replace', index=False, chunksize=1000)
    print(f"Successfully imported {table_name}")

def main():
    engine = create_engine(DB_URL)
    dataset_dir = os.path.join(os.path.dirname(__file__), '..', 'datasets')
    
    # Datasets to import
    tasks = [
        ('GMIS-FillingUpPerPosition-Oct2025.csv', 'gmis_filling'),
        ('SHS-Industry.csv', 'shs_industry'),
        ('EFD-LMS-GIDCA-NSBI2023.csv', 'efd_lms'),
        ('2025-Third Level Officials DepEd-cleaned.csv', 'third_level_officials'),
        ('Private Schools Oct.2025.csv', 'private_schools')
    ]
    
    for filename, table in tasks:
        path = os.path.join(dataset_dir, filename)
        if os.path.exists(path):
            try:
                import_csv(path, table, engine)
            except Exception as e:
                print(f"Error importing {filename}: {e}")
        else:
            print(f"File {filename} not found, skipping.")

if __name__ == "__main__":
    main()
