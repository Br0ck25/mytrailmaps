const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");
const AdmZip = require("adm-zip");
const { topology } = require("topojson-server");

// 📁 Input and Output
const inputDir = __dirname;
const outputDir = path.resolve(__dirname, "../../../public/tracks");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// 🧽 Clean up KML formatting
function sanitizeKML(kmlText) {
  return kmlText
    .replace(/xmlns(:\w+)?="[^"]*"/g, "")
    .replace(/<\/?\w+:(\w+)/g, "<$1")
    .replace(/(\s)\w+:(\w+)=/g, "$1$2=")
    .replace(/<headingMode>.*?<\/headingMode>/gs, "");
}

// 📛 Format filename to a clean label
function titleCase(str) {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-|_)\w/g, match => match.toUpperCase());
}

// 🛠 Convert and save as TopoJSON
function convertAndWriteTopo(geojson, baseName, labelName) {
  // Calculate center from all LineStrings
  const allCoords = geojson.features
    .filter(f => f.geometry?.type === "LineString")
    .flatMap(f => f.geometry.coordinates);

  if (allCoords.length > 0) {
    const [sumLng, sumLat] = allCoords.reduce(
      ([lngSum, latSum], [lng, lat]) => [lngSum + lng, latSum + lat],
      [0, 0]
    );
    const center = [sumLng / allCoords.length, sumLat / allCoords.length];

    geojson.features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: center },
      properties: {
        type: "file-label",
        label: labelName
      }
    });
  }

  const topo = topology({ data: geojson });
  const outPath = path.join(outputDir, `${baseName}.topojson`);
  fs.writeFileSync(outPath, JSON.stringify(topo));
  console.log("✅ Converted:", outPath);
}

// 🔁 Process each file
fs.readdirSync(inputDir).forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  const baseName = path.basename(file, ext);
  const labelName = titleCase(baseName.replace(/\s+/g, " ").trim());
  const inputPath = path.join(inputDir, file);

  try {
    if (ext === ".gpx") {
      const text = fs.readFileSync(inputPath, "utf8");
      const dom = new DOMParser().parseFromString(text, "application/xml");
      const geojson = togeojson.gpx(dom);
      convertAndWriteTopo(geojson, baseName, labelName);

    } else if (ext === ".kml") {
      let text = fs.readFileSync(inputPath, "utf8");
      text = sanitizeKML(text);
      const dom = new DOMParser().parseFromString(text, "application/xml");
      const geojson = togeojson.kml(dom);
      convertAndWriteTopo(geojson, baseName, labelName);

    } else if (ext === ".kmz") {
      const zip = new AdmZip(inputPath);
      const kmlEntry = zip.getEntries().find(e => e.entryName.endsWith(".kml"));
      if (!kmlEntry) throw new Error("No .kml inside .kmz");
      let text = kmlEntry.getData().toString("utf8");
      text = sanitizeKML(text);
      const dom = new DOMParser().parseFromString(text, "application/xml");
      const geojson = togeojson.kml(dom);
      convertAndWriteTopo(geojson, baseName, labelName);
    }
  } catch (err) {
    console.error(`❌ Failed to convert ${file}: ${err.message}`);
  }
});

// 🗂 Create manifest
const manifestFiles = fs.readdirSync(outputDir)
  .filter(f => f.toLowerCase().endsWith(".topojson"))
  .sort();

fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  JSON.stringify(manifestFiles, null, 2)
);

console.log(`📄 Manifest updated with ${manifestFiles.length} track(s).`);
