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

    // Extract track names and descriptions
    const trkEls = dom.getElementsByTagName("trk");
    const names = [];

    // Loop through each <trk> and grab the name
    for (let i = 0; i < trkEls.length; i++) {
      const nameTag = trkEls[i].getElementsByTagName("name")[0];
      names.push(nameTag ? nameTag.textContent : `Track ${i + 1}`);
    }

    // Ensure each track in the GeoJSON gets its correct name
    let trkIndex = 0;
    geojson.features.forEach((f) => {
      if (f.geometry?.type === "LineString") {
        // Preserve the correct name from GPX <name>
        f.properties.name = names[trkIndex++] || f.properties.name; 
      }
    });

    // Define output file path and save the GeoJSON
    const outPath = path.join(outputDir, file.replace(".gpx", ".geojson"));
    fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));

    console.log("✅ Converted:", file);
  });
