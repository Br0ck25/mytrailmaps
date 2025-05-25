import fetch from "node-fetch";
import { DOMParser } from "xmldom";
import { gpx } from "@tmcw/togeojson"; // 🆕 use maintained fork
import fs from "fs";

// 🚨 UPDATE this to your Worker KV token and namespace binding
const CF_ACCOUNT_ID = "472fe4d7673807cf0d44847c19f31e57";
const CF_API_TOKEN = "SiB29qLgbUxIAJBzp2uOwq8ZHQ7zn7YphOuAEmBE";
const KV_NAMESPACE_ID = "b65d1ca3fddf46f585584b70b3c4582f";

const headers = {
  Authorization: `Bearer ${CF_API_TOKEN}`,
  "Content-Type": "application/json",
};

async function listAdminGPXKeys() {
  const keys = [];
  let cursor = undefined;

  while (true) {
    const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/keys`);
    url.searchParams.set("prefix", "gpx:admin:");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!data.success) throw new Error("Failed to list KV keys");

    keys.push(...data.result.map(k => k.name));

    if (data.result_info?.cursor && data.result_info.cursor !== cursor) {
      cursor = data.result_info.cursor;
    } else break;
  }

  return keys;
}


async function getGPXFile(key) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`;
  const res = await fetch(url, { headers });
  return await res.text();
}

function computeBounds(gpxText) {
  const gpxDom = new DOMParser().parseFromString(gpxText);
  const geojson = gpx(gpxDom);
  const coords = [];

  geojson.features.forEach(f => {
    if (f.geometry.type === "LineString") {
      coords.push(...f.geometry.coordinates);
    } else if (f.geometry.type === "Point") {
      coords.push(f.geometry.coordinates);
    } else if (f.geometry.type === "MultiLineString") {
      f.geometry.coordinates.forEach(c => coords.push(...c));
    }
  });

  if (!coords.length) return null;

  const lats = coords.map(c => c[1]);
  const lons = coords.map(c => c[0]);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };
}

async function main() {
  const keys = await listAdminGPXKeys();
  const index = [];

  for (const key of keys) {
    const slug = key.replace(/^gpx:admin:/, "").replace(/\.gpx$/, "");
    console.log(`🧭 Processing: ${slug}`);
    const gpxText = await getGPXFile(key);
    const bounds = computeBounds(gpxText);
    if (bounds) {
      index.push({ slug, ...bounds });
    } else {
      console.warn(`⚠️ No coordinates found in ${slug}`);
    }
  }

  console.log(`📦 Writing ${index.length} entries to KV index...`);

  const putUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/track-index`;
  const res = await fetch(putUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(index),
  });

  const result = await res.json();
  console.log("✅ Done:", result.success);
}

main().catch(err => {
  console.error("💥 Error:", err);
});
