import polars as pl
import sys
import json
import os
import argparse

def main():
    parser = argparse.ArgumentParser(description='Fast School Search Engine')
    parser.add_argument('--query', type=str, default='', help='Search term')
    parser.add_argument('--region', type=str, default='All Regions', help='Region filter')
    parser.add_argument('--limit', type=int, default=1000, help='Result limit')
    parser.add_argument('--mode', type=str, default='search', choices=['search', 'explorer'], help='Output mode')
    
    args = parser.parse_args()
    
    # Path to the dataset
    dataset_dir = os.path.join(os.path.dirname(__file__), '..', 'datasets')
    csv_path = os.path.join(dataset_dir, 'School-Unique-v2.csv')
    parquet_path = os.path.join(dataset_dir, 'School-Unique-v2.parquet')
    
    try:
        # Prioritize Parquet for ultra-fast loading (sub-100ms)
        if os.path.exists(parquet_path):
            df = pl.read_parquet(parquet_path)
        elif os.path.exists(csv_path):
            df = pl.read_csv(csv_path, ignore_errors=True)
        else:
            print(json.dumps({"status": "error", "message": "Dataset not found"}))
            return
        
        # Apply Filters
        filtered_df = df
        
        # 1. Region Filter
        if args.region and args.region != 'All Regions':
            # Polars is case sensitive for exact matches
            filtered_df = filtered_df.filter(pl.col("Region") == args.region)
            
        # 2. Fuzzy Text Search
        if args.query:
            q = args.query.lower()
            filtered_df = filtered_df.filter(
                (pl.col("School.Name").str.to_lowercase().str.contains(q)) |
                (pl.col("Division").str.to_lowercase().str.contains(q)) |
                (pl.col("Municipality").str.to_lowercase().str.contains(q)) |
                (pl.col("SchoolID").cast(pl.Utf8).str.contains(q))
            )
            
        total_matched = len(filtered_df)
        result_df = filtered_df.head(args.limit)
        
        # 3. Mode-based Column Selection
        if args.mode == 'search':
            # Schema for Quick Search
            final_df = result_df.select([
                pl.col("SchoolID").alias("id"),
                pl.col("School.Name").alias("name"),
                pl.col("Region").alias("region"),
                pl.col("Division").alias("division"),
                pl.col("Municipality").alias("municipality"),
                pl.col("Latitude").alias("lat"),
                pl.col("Longitude").alias("lng"),
                pl.col("TotalEnrolment").alias("enrolment")
            ])
        else:
            # Schema for Data Explorer (More detailed)
            # Reusing the JS priority columns list logic
            priority_cols = ["SchoolID", "School.Name", "Region", "Division", "TotalEnrolment", "TotalTeachers", "Classroom.Requirement", "Total.Shortage"]
            # Ensure columns exist before selecting
            cols_to_select = [c for c in priority_cols if c in result_df.columns]
            final_df = result_df.select(cols_to_select)
        
        results = final_df.to_dicts()
        
        print(json.dumps({
            "status": "success",
            "totalMatched": total_matched,
            "displayed": len(results),
            "rows": results,
            "columns": final_df.columns
        }))

    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    main()
