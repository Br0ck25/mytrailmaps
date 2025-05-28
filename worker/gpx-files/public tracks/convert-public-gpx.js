const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");

// 📁 Input folder (this script's folder)
const inputDir = __dirname;

// 📁 Output folder for your site
const outputDir = path.resolve(__dirname, "../../../public/public-tracks");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(inputDir)
  .filter((file) => file.toLowerCase().endsWith(".gpx"))
  .forEach((file) => {
    const gpxText = fs.readFileSync(path.join(inputDir, file), "utf8");
    const dom = new DOMParser().parseFromString(gpxText, "application/xml");

    // Convert GPX to GeoJSON
    const geojson = togeojson.gpx(dom);

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

      // ✅ Extract color from <extensions>
      const ext = trk.getElementsByTagName("extensions")[0];
      let color = null;

      if (ext) {
        const colorTag = ext.getElementsByTagName("color")[0] || ext.getElementsByTagName("trk:color")[0];
        if (colorTag?.textContent) {
          let raw = colorTag.textContent.trim();
          // ✅ Ensure it starts with '#'
          if (!raw.startsWith("#")) {
            raw = `#${raw}`;
          }
          // ✅ Validate hex format
          if (/^#([0-9A-Fa-f]{6})$/.test(raw)) {
            color = raw;
          }
        }
      }

      colors.push(color); // could be null
    }

    // ✅ Assign metadata and stroke to LineString features
    let trkIndex = 0;
    geojson.features.forEach((f) => {
      if (f.geometry?.type === "LineString") {
        f.properties.name = names[trkIndex] || f.properties.name;
        f.properties.description = descriptions[trkIndex] || "No description available";

        if (colors[trkIndex]) {
          f.properties.stroke = colors[trkIndex];
        }

        trkIndex++;
      }
    });

    // ✅ Save .geojson file
    const outPath = path.join(outputDir, file.replace(/\.gpx$/i, ".geojson"));
    fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));

    console.log("✅ Converted:", file);
  });
