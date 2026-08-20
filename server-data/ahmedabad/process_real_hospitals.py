import pandas as pd
import json

# Load national hospitals dataset
df = pd.read_csv('national_hospitals.csv', low_memory=False)

# Filter for Ahmedabad safely
ahmedabad_hosp = df[df['address'].astype(str).str.contains('Ahmedabad', case=False, na=False)].copy()

valid_features = []
for idx, row in ahmedabad_hosp.iterrows():
    # Check if lat/lon exist and are valid numbers
    try:
        lat = float(row['latitude'])
        lon = float(row['longitude'])
        if lat != 0 and lon != 0:
            valid_features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "hospital_name": row.get('hospital_name', 'Unknown'),
                    "address": row.get('address', ''),
                    "beds": row.get('beds', 0)
                }
            })
    except (ValueError, TypeError):
        continue  # Safely skip unparseable or blank coordinates

# Save the actual successfully parsed count
geojson_output = {"type": "FeatureCollection", "features": valid_features}
with open('ahmedabad_hospitals.geojson', 'w') as f:
    json.dump(geojson_output, f, indent=2)

print(f"Successfully processed and saved {len(valid_features)} geocoded hospitals out of {len(ahmedabad_hosp)} total records.")