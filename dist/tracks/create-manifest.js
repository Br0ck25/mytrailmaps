// create-manifest.js (ES Module version)
import { readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tracksDir = __dirname;
const manifestPath = join(tracksDir, "manifest.json");

const files = readdirSync(tracksDir).filter(
  f => f.endsWith(".topojson") && !f.startsWith(".") && statSync(join(tracksDir, f)).isFile()
);

writeFileSync(manifestPath, JSON.stringify(files, null, 2));
console.log(`✅ Created manifest.json with ${files.length} file(s)`);
