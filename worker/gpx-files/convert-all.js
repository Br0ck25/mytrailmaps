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

    // Extract track metadata
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

    // Assign metadata to LineString features
    let trkIndex = 0;
    geojson.features.forEach((f) => {
      if (f.geometry?.type === "LineString") {
        f.properties.name = names[trkIndex] || f.properties.name;
        f.properties.description = descriptions[trkIndex] || "No description available";
        trkIndex++;
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
