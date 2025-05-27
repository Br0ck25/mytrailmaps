const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");

const inputDir = "."; // your input directory with GPX files
const outputDir = "../geojson-files"; // output directory for GeoJSON files

fs.readdirSync(inputDir)
  .filter((file) => file.endsWith(".gpx"))
  .forEach((file) => {
    const gpxText = fs.readFileSync(path.join(inputDir, file), "utf8");
    const dom = new DOMParser().parseFromString(gpxText, "application/xml");

    // Convert GPX to GeoJSON
    const geojson = togeojson.gpx(dom);

    // Add track descriptions from <desc> or <cmt> into GeoJSON properties
    const trkEls = dom.getElementsByTagName("trk");
    const descriptions = [];

    // Loop through each <trk> and grab its description or comment
    for (let i = 0; i < trkEls.length; i++) {
      const descTag = trkEls[i].getElementsByTagName("desc")[0];
      const cmtTag = trkEls[i].getElementsByTagName("cmt")[0];

      descriptions.push(descTag ? descTag.textContent : cmtTag ? cmtTag.textContent : "No description available");
    }

    // Add description as a property to each feature in the GeoJSON
    let trkIndex = 0;
    geojson.features.forEach((f) => {
      if (f.geometry?.type === "LineString") {
        f.properties.description = descriptions[trkIndex++] || f.properties.description;
      }
    });

    // Define output file path and save the GeoJSON
    const outPath = path.join(outputDir, file.replace(".gpx", ".geojson"));
    fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));

    console.log("✅ Converted:", file);
  });
