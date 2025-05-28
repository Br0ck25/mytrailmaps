const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");

// 📂 Input directory: this script's folder
const inputDir = __dirname;

// 📂 Output directory: public-facing /public/public-tracks
const outputDir = path.resolve(__dirname, "../../../public/public-tracks");

// Ensure output folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read all GPX files in the input folder
fs.readdirSync(inputDir)
  .filter((file) => file.toLowerCase().endsWith(".gpx"))
  .forEach((file) => {
    const filePath = path.join(inputDir, file);
    const gpxText = fs.readFileSync(filePath, "utf8");
    const dom = new DOMParser().parseFromString(gpxText, "application/xml");

    // Convert GPX to GeoJSON
    const geojson = togeojson.gpx(dom);

    // Extract track names, descriptions, and colors from <trk>
    const trkEls = dom.getElementsByTagName("trk");
    const names = [];
    const descriptions = [];
    const colors = [];

    for (let i = 0; i < trkEls.length; i++) {
      const trk = trkEls[i];
      const nameTag = trk.getElementsByTagName("name")[0];
      const descTag = trk.getElementsByTagName("desc")[0];
      const cmtTag = trk.getElementsByTagName("cmt")[0];

      names.push(nameTag ? nameTag.textContent : `Track ${i + 1}`);
      descriptions.push(descTag?.textContent || cmtTag?.textContent || "");

      // Look in <extensions> for <color>
      let color = null;
      const ext = trk.getElementsByTagName("extensions")[0];
      if (ext) {
        const colorTag = ext.getElementsByTagName("color")[0] || ext.getElementsByTagName("trk:color")[0];
        if (colorTag?.textContent) {
          color = colorTag.textContent.trim();
        }
      }
      colors.push(color);
    }

    // Assign name, description, and color to each LineString
    let trkIndex = 0;
    geojson.features.forEach((f) => {
      if (f.geometry?.type === "LineString") {
        f.properties.name = names[trkIndex] || f.properties.name;
        f.properties.description = descriptions[trkIndex] || "No description available";
        if (colors[trkIndex]) {
          f.properties.stroke = colors[trkIndex]; // ⬅️ Use GPX-defined stroke color
        }
        trkIndex++;
      }
    });

    // Save as .geojson
    const outFile = path.join(outputDir, file.replace(/\.gpx$/i, ".geojson"));
    fs.writeFileSync(outFile, JSON.stringify(geojson, null, 2));

    console.log("✅ Converted:", file);
  });
