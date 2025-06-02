import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import slugify from "slugify";
import { DOMParser } from "xmldom";
import fetch from "node-fetch";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GPX_DIR = path.join(__dirname, "gpx-files");

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const KV_ID = process.env.TRACKS_KV_ID;
const API_TOKEN = process.env.CF_API_TOKEN;

function extractMetadata(gpxText) {
  const doc = new DOMParser().parseFromString(gpxText, "text/xml");
  const trk = doc.getElementsByTagName("trk")[0];
  const name = trk?.getElementsByTagName("name")[0]?.textContent?.trim() || "Unnamed";
  const slug = slugify(name, { lower: true, strict: true });
  const color = Array.from(trk?.getElementsByTagName("extensions") || [])
    .flatMap((ext) => Array.from(ext.getElementsByTagName("DisplayColor")))
    .map((n) => n.textContent?.trim())?.[0] || null;
  return { name, slug, color };
}

function hashTrackPoints(gpxText) {
  const doc = new DOMParser().parseFromString(gpxText, "text/xml");
  const trkpts = Array.from(doc.getElementsByTagName("trkpt"))
    .map((pt) => `${pt.getAttribute("lat")},${pt.getAttribute("lon")}`)
    .join(";");
  return crypto.createHash("sha256").update(trkpts).digest("hex");
}

async function uploadToKV(key, value, isBinary = false) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_ID}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": isBinary ? "application/gpx+xml" : "application/json",
    },
    body: value,
  });
  return res.ok;
}

async function uploadAll() {
  const seenHashes = new Set();
  const files = fs.readdirSync(GPX_DIR).filter(f => f.endsWith(".gpx"));

  for (const file of files) {
    const gpxText = fs.readFileSync(path.join(GPX_DIR, file), "utf8");
    const { name, slug, color } = extractMetadata(gpxText);
    const hash = hashTrackPoints(gpxText);

    if (seenHashes.has(hash)) {
      console.log("⚠️ Duplicate track skipped:", file);
      continue;
    }
    seenHashes.add(hash);

    console.log(`⬆️ Uploading ${file} → slug: ${slug}`);
    const gpxOk = await uploadToKV(`gpx:admin:${slug}.gpx`, gpxText, true);
    const metaOk = await uploadToKV(`meta:admin:${slug}`, JSON.stringify({ name, slug, color, hash }));

    if (gpxOk && metaOk) {
      console.log(`✅ Uploaded ${file} as ${slug}`);
    } else {
      console.error(`❌ Failed to upload ${file}`);
    }
  }
}

uploadAll().catch((err) => console.error("❌ Unexpected error:", err));
