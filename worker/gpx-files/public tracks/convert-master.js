const fs = require("fs");
const path = require("path");
const { DOMParser } = require("@xmldom/xmldom");
const togeojson = require("@tmcw/togeojson");
const { topology } = require("topojson-server");

// File paths
const inputPath = path.resolve(__dirname, "Master Main Trail Map.kml");
const outputPath = path.resolve(__dirname, "Master Main Trail Map.topojson");

try {
  const kmlText = fs.readFileSync(inputPath, "utf8");
  const dom = new DOMParser().parseFromString(kmlText, "application/xml");
  const geojson = togeojson.kml(dom);
  const topo = topology({ data: geojson });
  fs.writeFileSync(outputPath, JSON.stringify(topo, null, 2));
  console.log("✅ Converted to TopoJSON:", outputPath);
} catch (err) {
  console.error("❌ Failed to convert:", err.message);
}
