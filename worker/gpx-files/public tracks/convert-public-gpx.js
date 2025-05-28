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
  return kmlText
    .replace(/xmlns(:\w+)?="[^"]*"/g, "")
    .replace(/<\/?\w+:(\w+)/g, "<$1")
    .replace(/(\s)\w+:(\w+)=/g, "$1$2=")
    .replace(/<headingMode>.*?<\/headingMode>/gs, "");
}

// 🔁 Process all supported files
fs.readdirSync(inputDir).forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  const baseName = path.basename(file, ext);
  const inputPath = path.join(inputDir, file);

  const convertAndWriteTopo = (geojson, baseName) => {
    const topo = topology({ data: geojson });
    const topoPath = path.join(outputDir, `${baseName}.topojson`);
    fs.writeFileSync(topoPath, JSON.stringify(topo));
    console.log("✅ Converted to TopoJSON:", topoPath);
  };

  try {
    if (ext === ".gpx") {
      const gpxText = fs.readFileSync(inputPath, "utf8");
      const dom = new DOMParser({ onError: () => {} }).parseFromString(gpxText, "application/xml");
      const geojson = togeojson.gpx(dom);
      convertAndWriteTopo(geojson, baseName);

    } else if (ext === ".kml") {
      let kmlText = fs.readFileSync(inputPath, "utf8");
      kmlText = sanitizeKML(kmlText);
      const dom = new DOMParser({ onError: () => {} }).parseFromString(kmlText, "application/xml");
      const geojson = togeojson.kml(dom);
      convertAndWriteTopo(geojson, baseName);

    } else if (ext === ".kmz") {
      const zip = new AdmZip(inputPath);
      const kmlEntry = zip.getEntries().find(e => e.entryName.endsWith(".kml"));
      if (!kmlEntry) throw new Error("No .kml inside .kmz");
      let kmlText = kmlEntry.getData().toString("utf8");
      kmlText = sanitizeKML(kmlText);
      const dom = new DOMParser({ onError: () => {} }).parseFromString(kmlText, "application/xml");
      const geojson = togeojson.kml(dom);
      convertAndWriteTopo(geojson, baseName);
    }
  } catch (err) {
    console.error(`❌ Failed to convert ${file}: ${err.message}`);
  }
});
