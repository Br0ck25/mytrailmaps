import fs from "fs";

const input = "BlackMountainOffRoadAdventureArea.geojson";
const output = "BlackMountainOffRoadAdventureArea-lines.geojson";

const data = JSON.parse(fs.readFileSync(input, "utf8"));

const features = data.features
  .filter(f => ["LineString", "MultiLineString"].includes(f.geometry?.type))
  .map(f => {
    if (f.geometry.type === "LineString") {
      f.geometry.coordinates = f.geometry.coordinates.map(([lon, lat]) => [lon, lat]);
    }
    if (f.geometry.type === "MultiLineString") {
      f.geometry.coordinates = f.geometry.coordinates.map(line =>
        line.map(([lon, lat]) => [lon, lat])
      );
    }
    return f;
  });

const result = {
  type: "FeatureCollection",
  features
};

fs.writeFileSync(output, JSON.stringify(result));
console.log("✅ Saved cleaned file:", output);
