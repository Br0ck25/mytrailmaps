import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Needed to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔍 Directory containing your .topojson files
const tracksDir = path.resolve(__dirname); // current directory


// 📄 Output manifest file
const manifestPath = path.join(tracksDir, "manifest.json");

// 📦 Get all .topojson filenames
const files = fs.readdirSync(tracksDir)
  .filter(f => f.endsWith(".topojson") && !f.startsWith("."));

// 🧾 Save manifest
fs.writeFileSync(manifestPath, JSON.stringify(files, null, 2));
console.log("✅ Created manifest.json with", files.length, "files");
