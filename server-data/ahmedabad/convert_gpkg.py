import geopandas as gpd
import os

# List of your large geopackage files
gpkg_files = ['roads_data.gpkg', 'western-zone.gpkg']

for gpkg in gpkg_files:
    if os.path.exists(gpkg):
        print(f"Reading {gpkg}...")
        # Read the spatial database
        gdf = gpd.read_file(gpkg)
        
        # Keep only the first 500 rows to make it lightweight
        small_gdf = gdf.head(500)
        
        # Save as a small GeoJSON file
        output_name = f"small_{gpkg.replace('.gpkg', '.geojson')}"
        small_gdf.to_file(output_name, driver='GeoJSON')
        print(f"Success! Created lightweight file: {output_name}")
    else:
        print(f"File {gpkg} not found in your folder. Make sure it's in the same directory.")