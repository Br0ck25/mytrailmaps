const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");
const AdmZip = require("adm-zip");
const { topology } = require("topojson-server");

// 📁 Input and Output
const inputDir = __dirname;
const outputDir = path.resolve(__dirname, "../../../public/public-tracks");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// 🔧 KML sanitizer (robust)
function sanitizeKML(kmlText) {
  // Remove broken <link> ... </Document>
  kmlText = kmlText.replace(/<link[\s\S]*?<\/Document>/gi, "</Document>");
  // Remove standard <link> blocks
  kmlText = kmlText.replace(/<link[\s\S]*?<\/link>/gi, "");
  return kmlText
    .replace(/xmlns(:\w+)?="[^"]*"/g, "")
    .replace(/<\/?\w+:(\w+)/g, "<$1")
    .replace(/(\s)\w+:(\w+)=/g, "$1$2=")
    .replace(/<headingMode>.*?<\/headingMode>/gs, "");
}

// ✅ Convert GeoJSON to TopoJSON and write output
const convertedFiles = [];

function convertAndWriteTopo(geojson, baseName) {
  if (!geojson.features || geojson.features.length === 0) {
    console.warn(`⚠️ Skipped ${baseName}: no features found`);
    return;
  }

  const topo = topology({ data: geojson });
  const topoPath = path.join(outputDir, `${baseName}.topojson`);
  fs.writeFileSync(topoPath, JSON.stringify(topo, null, 2));
  console.log("✅ Converted to TopoJSON:", path.basename(topoPath));
  convertedFiles.push(path.basename(topoPath));
}

// 🔁 Process files in the input directory
fs.readdirSync(inputDir).forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  const baseName = path.basename(file, ext);
  const inputPath = path.join(inputDir, file);

  try {
    if (ext === ".gpx") {
      const gpxText = fs.readFileSync(inputPath, "utf8");
      const dom = new DOMParser().parseFromString(gpxText, "application/xml");
      const geojson = togeojson.gpx(dom);
      convertAndWriteTopo(geojson, baseName);

    } else if (ext === ".kml") {
      let kmlText = fs.readFileSync(inputPath, "utf8");
      kmlText = sanitizeKML(kmlText);
      const dom = new DOMParser().parseFromString(kmlText, "application/xml");
      const geojson = togeojson.kml(dom);
      convertAndWriteTopo(geojson, baseName);

    } else if (ext === ".kmz") {
      const zip = new AdmZip(inputPath);
      const kmlEntry = zip.getEntries().find(e => e.entryName.toLowerCase().endsWith(".kml"));
      if (!kmlEntry) throw new Error("No .kml file found in .kmz archive");
      let kmlText = kmlEntry.getData().toString("utf8");
      kmlText = sanitizeKML(kmlText);
      const dom = new DOMParser().parseFromString(kmlText, "application/xml");
      const geojson = togeojson.kml(dom);
      convertAndWriteTopo(geojson, baseName);
    }

  } catch (err) {
    console.error(`❌ Failed to convert ${file}: ${err.message}`);
  }
});

// 📄 Write manifest.json
const manifestPath = path.join(outputDir, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(convertedFiles.sort(), null, 2));
console.log(`📄 Manifest written with ${convertedFiles.length} file(s).`);
