import fs from "fs";
import { DOMParser } from "@xmldom/xmldom";
import { gpx } from "@tmcw/togeojson";

const gpxPath = process.argv[2];
const geojsonPath = process.argv[3];

const gpxText = fs.readFileSync(gpxPath, "utf8");
const gpxXml = new DOMParser().parseFromString(gpxText, "application/xml");
const geojson = gpx(gpxXml);

fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 2));
console.log("✅ Converted to GeoJSON:", geojsonPath);
