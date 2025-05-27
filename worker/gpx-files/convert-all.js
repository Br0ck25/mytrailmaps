const fs = require("fs");
const path = require("path");
const togeojson = require("@tmcw/togeojson");
const { DOMParser } = require("@xmldom/xmldom");

const inputDir = ".";
const outputDir = "../geojson-files";

fs.readdirSync(inputDir)
  .filter((file) => file.endsWith(".gpx"))
  .forEach((file) => {
    const gpxText = fs.readFileSync(path.join(inputDir, file), "utf8");
    const dom = new DOMParser().parseFromString(gpxText, "application/xml");
    const geojson = togeojson.gpx(dom);

    const outPath = path.join(outputDir, file.replace(".gpx", ".geojson"));
    fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));
    console.log("✅ Converted:", file);
  });
