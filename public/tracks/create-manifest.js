import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith(".geojson"));
const output = path.join(dir, "manifest.json");

fs.writeFileSync(output, JSON.stringify(files, null, 2));
console.log("✅ Manifest created:", output);
