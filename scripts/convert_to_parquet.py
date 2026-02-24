import polars as pl
import os

def convert_to_parquet():
    dataset_dir = os.path.join(os.path.dirname(__file__), '..', 'datasets')
    csv_path = os.path.join(dataset_dir, 'School-Unique-v2.csv')
    parquet_path = os.path.join(dataset_dir, 'School-Unique-v2.parquet')
    
    if os.path.exists(csv_path):
        print(f"Reading {csv_path}...")
        df = pl.read_csv(csv_path, ignore_errors=True)
        print(f"Writing {parquet_path}...")
        df.write_parquet(parquet_path)
        print("Success!")
    else:
        print(f"Error: {csv_path} not found.")

if __name__ == "__main__":
    convert_to_parquet()
