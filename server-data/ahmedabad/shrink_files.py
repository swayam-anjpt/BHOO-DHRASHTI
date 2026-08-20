import pandas as pd
import json
import os

# 1. Shrink a large CSV file safely (skipping any bad lines)
csv_filename = "SANKALP_v4_Max_Density_Data.csv"  # or training_dataset.csv
output_csv = "small_" + csv_filename

if os.path.exists(csv_filename):
    print(f"Reading {csv_filename} (this may take a second)...")
    # on_bad_lines='skip' prevents the parser error from crashing the script
    df = pd.read_csv(csv_filename, on_bad_lines='skip', low_memory=False)
    
    # Keep only the first 1,000 rows
    small_df = df.head(1000)
    small_df.to_csv(output_csv, index=False)
    print(f"Success! Created lightweight file: {output_csv}")
else:
    print(f"File {csv_filename} not found in directory.")