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

// 🔧 KML sanitizer
function sanitizeKML(kmlText) {
  // Remove any malformed <link> ... </Document> blocks that confuse parsers
  if (kmlText.includes("<link") && kmlText.includes("</Document>")) {
    const linkStart = kmlText.indexOf("<link");
    const docClose = kmlText.indexOf("</Document>", linkStart);
    if (linkStart !== -1 && docClose !== -1) {
      // Remove from <link> to </Document> inclusive
      kmlText = kmlText.slice(0, linkStart) + "</Document>" + kmlText.slice(docClose + "</Document>".length);
    }
  }

  return kmlText
    .replace(/<link[\s\S]*?<\/link>/gi, "")              // Normal link blocks
    .replace(/xmlns(:\w+)?="[^"]*"/g, "")                // Remove namespace declarations
    .replace(/<\/?\w+:(\w+)/g, "<$1")                    // Strip namespace prefixes
    .replace(/(\s)\w+:(\w+)=/g, "$1$2=")                 // Clean attributes
    .replace(/<headingMode>.*?<\/headingMode>/gs, "");   // Remove unsupported tag
}




// ✅ Convert GeoJSON to TopoJSON and write file
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

// 🔁 Process all supported files
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
    let kmlText;
    try {
      kmlText = fs.readFileSync(inputPath, "utf8");
      kmlText = sanitizeKML(kmlText);
      const dom = new DOMParser().parseFromString(kmlText, "application/xml");
      const geojson = togeojson.kml(dom);
      convertAndWriteTopo(geojson, baseName);
    } catch (e) {
      throw new Error(`KML parse/convert error: ${e.message}`);
    }

  } else if (ext === ".kmz") {
    try {
      const zip = new AdmZip(inputPath);
      const kmlEntry = zip.getEntries().find(e => e.entryName.endsWith(".kml"));
      if (!kmlEntry) throw new Error("No .kml file found in .kmz archive");
      let kmlText = kmlEntry.getData().toString("utf8");
      kmlText = sanitizeKML(kmlText);
      const dom = new DOMParser().parseFromString(kmlText, "application/xml");
      const geojson = togeojson.kml(dom);
      convertAndWriteTopo(geojson, baseName);
    } catch (e) {
      throw new Error(`KMZ extract/convert error: ${e.message}`);
    }
  }
} catch (err) {
  console.error(`❌ Failed to convert ${file}: ${err.message}`);
}

});

// 📄 Write manifest.json
const manifestPath = path.join(outputDir, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(convertedFiles.sort(), null, 2));
console.log(`📄 Manifest written with ${convertedFiles.length} file(s).`);
