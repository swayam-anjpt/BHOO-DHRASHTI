import geopandas as gpd

# 1. Inspect what layers are inside the GeoPackage file
print("Checking available layers in your GeoPackage file...")
layers = gpd.list_layers("roads_data.gpkg")
print(layers)

# 2. Automatically find the road layer name (usually contains 'roads' or 'line')
road_layer = None
for idx, row in layers.iterrows():
    name = row['name']
    if 'road' in name.lower() or 'line' in name.lower():
        road_layer = name
        break

if not road_layer:
    road_layer = layers.iloc[0]['name'] # fallback to first layer

print(f"🛣️ Using road layer: '{road_layer}'")

# 3. Read and clip the data using the correct layer
print("Loading roads (this may take 30-60 seconds)...")
df = gpd.read_file("roads_data.gpkg", layer=road_layer)

print("Clipping roads to Ahmedabad bounding box...")
# Ahmedabad bounding box [xmin, ymin, xmax, ymax]
clipped_roads = df.cx[71.90:72.90, 22.75:23.35]

output_filename = "ahmedabad_roads.geojson"
print(f"Saving as {output_filename}...")
clipped_roads.to_file(output_filename, driver="GeoJSON")

print("🎉 Success! Ahmedabad road network is ready and saved!")