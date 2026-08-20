import pandas as pd
import json
import os

def process_backend_metrics():
    print("Starting data processing pipeline...")
    
    # 1. Check if training dataset exists
    if not os.path.exists('training_dataset.csv'):
        print("Error: training_dataset.csv not found!")
        return
    
    # 2. Load real training data
    df = pd.read_csv('training_dataset.csv')
    print(f"Successfully loaded training dataset with {len(df)} records.")
    
    # 3. Calculate real aggregate metrics for Ahmedabad
    total_records = len(df)
    avg_lst = round(float(df['LST'].mean()), 2)
    avg_ndvi = round(float(df['NDVI'].mean()), 3)
    avg_ndbi = round(float(df['NDBI'].mean()), 3)
    
    # Count heat vulnerability classes (e.g., High Risk = Class 2, Moderate = Class 1, Low = Class 0)
    heat_counts = df['Heat_Class'].value_counts().to_dict()
    
    # 4. Construct the summary metrics dictionary
    summary_data = {
        "region": "Ahmedabad District",
        "dataset_rows": total_records,
        "environmental_metrics": {
            "average_land_surface_temp_celsius": avg_lst,
            "average_vegetation_index_ndvi": avg_ndvi,
            "average_built_intensity_ndbi": avg_ndbi
        },
        "heat_vulnerability_breakdown": {
            "low_risk_zones": heat_counts.get(0, 0),
            "moderate_risk_zones": heat_counts.get(1, 0),
            "high_risk_zones": heat_counts.get(2, 0)
        },
        "status": "Processed successfully using real training_dataset.csv"
    }
    
    # 5. Export processed metrics to a clean JSON file for backend consumption
    output_filename = 'ahmedabad_processed_summary.json'
    with open(output_filename, 'w') as f:
        json.dump(summary_data, f, indent=2)
        
    print(f"Pipeline complete! Processed summary saved to '{output_filename}'.")

if __name__ == "__main__":
    process_backend_metrics()