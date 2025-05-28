const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");
const AdmZip = require("adm-zip");

// 📁 Input: GPX/KML/KMZ files
const inputDir = __dirname;
const outputDir = path.resolve(__dirname, "../../../public/public-tracks");

// 🔧 KML sanitizer for broken namespaces and tag mismatches
function sanitizeKML(kmlText) {
  return kmlText
    .replace(/xmlns(:\w+)?="[^"]*"/g, "")     // remove all xmlns declarations
    .replace(/<\/?\w+:(\w+)/g, "<$1")         // remove namespace prefixes in tags
    .replace(/(\s)\w+:(\w+)=/g, "$1$2=")      // remove prefixes in attributes
    .replace(/<IconStyle>(.*?)<\/headingMode>/gs, "<IconStyle>$1</IconStyle>"); // fix tag mismatch
}

// 🔁 Convert all supported files in folder
fs.readdirSync(inputDir).forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  const baseName = path.basename(file, ext);

  // Convert GPX
  if (ext === ".gpx") {
    try {
      const gpxText = fs.readFileSync(path.join(inputDir, file), "utf8");
      const dom = new DOMParser({ onError: () => {} }).parseFromString(gpxText, "application/xml");
      const geojson = togeojson.gpx(dom);

      const trkEls = dom.getElementsByTagName("trk");
      const names = [];
      const descriptions = [];

      for (let i = 0; i < trkEls.length; i++) {
        const nameTag = trkEls[i].getElementsByTagName("name")[0];
        const descTag = trkEls[i].getElementsByTagName("desc")[0];
        const cmtTag = trkEls[i].getElementsByTagName("cmt")[0];

        names.push(nameTag ? nameTag.textContent : `Track ${i + 1}`);
        descriptions.push(descTag?.textContent || cmtTag?.textContent || "");
      }

      let trkIndex = 0;
      geojson.features.forEach((f) => {
        if (f.geometry?.type === "LineString") {
          f.properties.name = names[trkIndex] || f.properties.name;
          f.properties.description = descriptions[trkIndex] || "No description available";
          trkIndex++;
        }
      });

      const outPath = path.join(outputDir, `${baseName}.geojson`);
      fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));
      console.log("✅ Converted GPX:", file);
    } catch (err) {
      console.error(`❌ Failed to convert GPX: ${file} — ${err.message}`);
    }
  }

  // Convert KMZ
  else if (ext === ".kmz") {
    try {
      const zip = new AdmZip(path.join(inputDir, file));
      const kmlEntry = zip.getEntries().find(e => e.entryName.endsWith(".kml"));
      if (!kmlEntry) return console.warn("⚠️ No .kml file found in:", file);

      let kmlText = kmlEntry.getData().toString("utf8");
      kmlText = sanitizeKML(kmlText);

      const dom = new DOMParser({ onError: () => {} }).parseFromString(kmlText, "application/xml");
      const geojson = togeojson.kml(dom);

      const outPath = path.join(outputDir, `${baseName}.geojson`);
      fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));
      console.log("✅ Converted KMZ:", file);
    } catch (err) {
      console.error(`❌ Failed to convert KMZ: ${file} — ${err.message}`);
    }
  }

  // Convert KML
  else if (ext === ".kml") {
    try {
      let kmlText = fs.readFileSync(path.join(inputDir, file), "utf8");
      kmlText = sanitizeKML(kmlText);

      const dom = new DOMParser({ onError: () => {} }).parseFromString(kmlText, "application/xml");
      const geojson = togeojson.kml(dom);

      const outPath = path.join(outputDir, `${baseName}.geojson`);
      fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));
      console.log("✅ Converted KML:", file);
    } catch (err) {
      console.error(`❌ Failed to convert KML: ${file} — ${err.message}`);
    }
  }
});
