const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");

const inputDir = "."; // GPX input directory
const outputDir = "../geojson-files"; // GeoJSON output directory

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ✅ Convert all GPX files
fs.readdirSync(inputDir)
  .filter((file) => file.endsWith(".gpx"))
  .forEach((file) => {
    const gpxText = fs.readFileSync(path.join(inputDir, file), "utf8");
    const dom = new DOMParser().parseFromString(gpxText, "application/xml");
    const geojson = togeojson.gpx(dom);

    // Format filename label (e.g., "My Trail.gpx" => "My Trail")
    const filenameLabel = file
      .replace(/\.gpx$/i, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Collect coordinates from all LineStrings
    const allCoords = geojson.features
      .filter(f => f.geometry?.type === "LineString")
      .flatMap(f => f.geometry.coordinates);

    // Compute center of all track points
    let center = [0, 0];
    if (allCoords.length > 0) {
      const [sumLng, sumLat] = allCoords.reduce(
        ([lngSum, latSum], [lng, lat]) => [lngSum + lng, latSum + lat],
        [0, 0]
      );
      center = [sumLng / allCoords.length, sumLat / allCoords.length];
    }

    // Add label point
    geojson.features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: center
      },
      properties: {
        name: filenameLabel,
        label: true,
        "marker-color": "#000",
        "marker-symbol": "marker"
      }
    });

    // Save GeoJSON
    const outPath = path.join(outputDir, file.replace(/\.gpx$/i, ".geojson"));
    fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));
    console.log("✅ Converted:", file);
  });

// ✅ Auto-generate manifest.json
const manifestFiles = fs.readdirSync(outputDir)
  .filter(f => f.toLowerCase().endsWith(".geojson"))
  .sort();

const manifestPath = path.join(outputDir, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifestFiles, null, 2));
console.log(`📄 Manifest updated with ${manifestFiles.length} track(s).`);
