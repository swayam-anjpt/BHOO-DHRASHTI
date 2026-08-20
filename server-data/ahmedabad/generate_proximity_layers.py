import json
import pandas as pd
import geopandas as gdf
from shapely.geometry import LineString, Point

# Mock Proximity and Utilities Network Data for Ahmedabad District
proximity_data = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "asset_id": "RD-AHM-01",
                "layer_type": "Roads",
                "name": "Sarkhej-Gandhinagar (SG) Highway",
                "status": "Operational"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[72.5070, 23.0100], [72.5150, 23.0800], [72.6300, 23.2150]]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "asset_id": "RD-AHM-02",
                "layer_type": "Roads",
                "name": "Ahmedabad-Dholera Expressway Link",
                "status": "Active"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[72.5500, 23.0000], [72.4500, 22.8500], [72.2000, 22.6500]]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "asset_id": "PWR-SUB-01",
                "layer_type": "Power Grid",
                "name": "Pirana 400kV Substation Node",
                "capacity": "400 kV"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [72.6100, 22.9600]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "asset_id": "PWR-SUB-02",
                "layer_type": "Power Grid",
                "name": "Koba Substation Hub",
                "capacity": "220 kV"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [72.6350, 23.1800]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "asset_id": "WAT-CAN-01",
                "layer_type": "Water Pipeline / Canal",
                "name": "Narmada Main Canal Feeder Line",
                "usage": "Bulk Irrigation & Water Supply"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[72.6800, 23.1500], [72.5800, 23.2500], [72.4000, 23.3500]]
            }
        }
    ]
}

# Save as a clean GeoJSON file for your server backend
output_file = "ahmedabad_proximity_layers.geojson"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(proximity_data, f, indent=2)

print(f"Successfully generated Proximity/Utilities layer with {len(proximity_data['features'])} elements!")
print(f"Saved to '{output_file}' ready for your backend mapping views!")