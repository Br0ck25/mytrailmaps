const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");

// ✅ Fix: current folder contains GPX files
const inputDir = __dirname;

// ✅ Output GeoJSON to your public-facing folder
const outputDir = path.resolve(__dirname, "../../../public/public-tracks");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}


fs.readdirSync(inputDir)
  .filter((file) => file.toLowerCase().endsWith(".gpx"))
  .forEach((file) => {
    const filePath = path.join(inputDir, file);
    const gpxText = fs.readFileSync(filePath, "utf8");
    const dom = new DOMParser().parseFromString(gpxText, "application/xml");

    // Convert GPX to GeoJSON
    const geojson = togeojson.gpx(dom);

    // Extract track names and descriptions
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

    // Assign name and description to LineString features
    let trkIndex = 0;
    geojson.features.forEach((f) => {
      if (f.geometry?.type === "LineString") {
        f.properties.name = names[trkIndex] || f.properties.name;
        f.properties.description = descriptions[trkIndex] || "No description available";
        trkIndex++;
      }
    });

    // Write output file to public-tracks folder
    const outFile = path.join(outputDir, file.replace(/\.gpx$/i, ".geojson"));
    fs.writeFileSync(outFile, JSON.stringify(geojson, null, 2));

    console.log("✅ Converted:", file);
  });
