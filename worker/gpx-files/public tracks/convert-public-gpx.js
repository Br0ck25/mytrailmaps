const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");
const { topology } = require("topojson-server");

const inputDir = __dirname;
const outputDir = path.resolve(__dirname, "../../../public/public-tracks");

function titleCase(str) {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-|_)\w/g, match => match.toUpperCase());
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(inputDir)
  .filter((file) => file.endsWith(".gpx"))
  .forEach((file) => {
    const gpxText = fs.readFileSync(path.join(inputDir, file), "utf8");
    const dom = new DOMParser().parseFromString(gpxText, "application/xml");
    const geojson = togeojson.gpx(dom);

    // Format filename label (e.g., "My Trail.gpx" => "My Trail")
    const filenameLabel = titleCase(
      file
        .replace(/\.gpx$/i, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );

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
        type: "file-label",
        label: filenameLabel
      }
    });

    // Convert GeoJSON to TopoJSON
    const topo = topology({ tracks: geojson });

    const outPath = path.join(outputDir, file.replace(/\.gpx$/i, ".topojson"));
    fs.writeFileSync(outPath, JSON.stringify(topo, null, 2));
    console.log("✅ Converted:", file);
  });

// Auto-generate manifest
const manifestFiles = fs.readdirSync(outputDir)
  .filter(f => f.toLowerCase().endsWith(".topojson"))
  .sort();

const manifestPath = path.join(outputDir, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifestFiles, null, 2));
console.log(`📄 Manifest updated with ${manifestFiles.length} track(s).`);
