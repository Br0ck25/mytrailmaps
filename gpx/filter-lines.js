// filter-lines.js
import fs from "fs";

const input = "BlackMountainOffRoadAdventureArea.geojson";
const output = "BlackMountainOffRoadAdventureArea-lines.geojson";

const data = JSON.parse(fs.readFileSync(input));
const features = data.features.filter(f => f.geometry?.type === "LineString");

// Strip Z (elevation) from coordinates
for (const f of features) {
  f.geometry.coordinates = f.geometry.coordinates.map(([lon, lat]) => [lon, lat]);
}

const result = {
  type: "FeatureCollection",
  features
};

fs.writeFileSync(output, JSON.stringify(result));
console.log("✅ Saved:", output);
