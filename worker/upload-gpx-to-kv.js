import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch"; // install this

dotenv.config();

const accountId = process.env.CF_ACCOUNT_ID;
const namespaceId = process.env.TRACKS_KV_ID;
const apiToken = process.env.CF_API_TOKEN;

const gpxDir = path.join(process.cwd(), "gpx-files");

const upload = async () => {
  const files = fs.readdirSync(gpxDir).filter(f => f.endsWith(".gpx"));

  for (const file of files) {
    const slug = path.basename(file, ".gpx");
    const key = `gpx:admin:${slug}.gpx`;
    const data = fs.readFileSync(path.join(gpxDir, file));

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${472fe4d7673807cf0d44847c19f31e57}/storage/kv/namespaces/${b65d1ca3fddf46f585584b70b3c4582f}/values/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/gpx+xml"
      },
      body: data
    });

    const result = await response.json();
    if (result.success) {
      console.log(`✅ Uploaded: ${key}`);
    } else {
      console.error(`❌ Failed to upload ${key}`, result.errors);
    }
  }
};

upload();
