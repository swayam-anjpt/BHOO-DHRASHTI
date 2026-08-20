import json
import pandas as pd

# Official Ahmedabad Talukas and administrative zones
talukas_data = [
    {"taluka": "Ahmedabad City", "zone": "Urban Core", "type": "Urban"},
    {"taluka": "Daskroi", "zone": "Suburban / East", "type": "Semi-Urban"},
    {"taluka": "Sanand", "zone": "West", "type": "Industrial Hub"},
    {"taluka": "Bavla", "zone": "South-West", "type": "Agricultural / Semi-Urban"},
    {"taluka": "Dholka", "zone": "South", "type": "Agricultural"},
    {"taluka": "Dhandhuka", "zone": "South-West Rural", "type": "Rural"},
    {"taluka": "Dholera", "zone": "South Special Region", "type": "Smart City / Industrial"},
    {"taluka": "Viramgam", "zone": "North-West", "type": "Agricultural / Logistics"},
    {"taluka": "Mandal", "zone": "North", "type": "Rural / Agricultural"},
    {"taluka": "Detroj-Rampura", "zone": "North-West", "type": "Rural"}
]

# Convert to a DataFrame and save as a clean JSON file
df_talukas = pd.DataFrame(talukas_data)
df_talukas.to_json("ahmedabad_talukas.json", orient="records", indent=2)

print(f"Successfully generated {len(df_talukas)} talukas for Ahmedabad district!")
print("Saved clean data to 'ahmedabad_talukas.json' ready for your backend!")