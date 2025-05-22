import * as L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";

const map = L.map("map", {
  zoomControl: false,
}).fitWorld();
L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);


const trail = [];
let polyline = null;
const importedTracks = []; // will hold { name, layer }

navigator.geolocation.watchPosition(
  (pos) => {
    const latlng = [pos.coords.latitude, pos.coords.longitude];
    L.marker(latlng).addTo(map);
    trail.push(latlng);
    if (polyline) map.removeLayer(polyline);
    polyline = L.polyline(trail, { color: "blue" }).addTo(map);
    map.setView(latlng, 16);
  },
  (err) => alert("GPS error: " + err.message),
  { enableHighAccuracy: true }
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

const saveTrack = async (geojson) => {
  const res = await fetch("https://mytrailmapsworker.jamesbrock25.workers.dev/save", {
    method: "POST",
    body: JSON.stringify(geojson),
  });
  const { id } = await res.json();
  alert("Track saved! ID: " + id);
};

const loadTrack = async (id) => {
  const res = await fetch(`https://mytrailmapsworker.jamesbrock25.workers.dev/load/${id}`);
  const geojson = await res.json();

  if (window.loadedTrackLayer) {
    map.removeLayer(window.loadedTrackLayer);
  }

  window.loadedTrackLayer = L.geoJSON(geojson, {
    style: { color: "green", weight: 4 }
  }).addTo(map);

  map.fitBounds(window.loadedTrackLayer.getBounds());
};

function exportGPX() {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MyTrailMaps" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>My Trail</name><trkseg>`;
  
  const gpxPoints = trail.map(([lat, lng]) =>
    `<trkpt lat="${lat}" lon="${lng}"></trkpt>`
  ).join("\n");

  const gpxFooter = `</trkseg></trk></gpx>`;

  const gpx = `${gpxHeader}\n${gpxPoints}\n${gpxFooter}`;
  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "track.gpx";
  a.click();
}

window.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("save-btn");
  const loadBtn = document.getElementById("load-btn");
  const exportBtn = document.getElementById("export-btn");
  const gpxExportBtn = document.getElementById("gpx-export-btn");
  const gpxInput = document.getElementById("gpx-upload");
  const loadIdInput = document.getElementById("load-id");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const geojson = {
        type: "FeatureCollection",
        features: trail.map(([lat, lng]) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
        })),
      };
      saveTrack(geojson);
    });
  }

  if (loadBtn) {
    loadBtn.addEventListener("click", async () => {
      const id = loadIdInput?.value.trim();
      if (!id) return alert("Enter a Track ID");
      await loadTrack(id);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const geojson = {
        type: "FeatureCollection",
        features: trail.map(([lat, lng]) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
        })),
      };
      const blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "track.geojson";
      a.click();
    });
  }

  if (gpxExportBtn) {
    gpxExportBtn.addEventListener("click", exportGPX);
  }

  if (gpxInput) {
gpxInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "application/xml");
  const geojson = toGeoJSON.gpx(xml);

  const name = file.name;

  const layer = L.geoJSON(geojson, {
    style: { color: "purple", weight: 3 }
  }).addTo(map);
  map.fitBounds(layer.getBounds());

  importedTracks.push({ name, layer });       // ✅ track it
  updateImportedTrackList();                  // ✅ show it
});
  }
});
const clearTrackBtn = document.getElementById("clear-track-btn");

if (clearTrackBtn) {
  clearTrackBtn.addEventListener("click", () => {
    if (window.loadedTrackLayer) {
      map.removeLayer(window.loadedTrackLayer);
      window.loadedTrackLayer = null;
    }
  });
}
function updateImportedTrackList() {
  const panel = document.getElementById("imported-tracks-panel");
  panel.innerHTML = "";

  importedTracks.forEach((track, index) => {
    const item = document.createElement("div");
    item.style.marginBottom = "4px";

    const label = document.createElement("span");
    label.textContent = track.name;

    const btn = document.createElement("button");
    btn.textContent = "🗑️";
    btn.style.marginLeft = "8px";
    btn.onclick = () => {
      map.removeLayer(track.layer);
      importedTracks.splice(index, 1);
      updateImportedTrackList();
    };

    item.appendChild(label);
    item.appendChild(btn);
    panel.appendChild(item);
  });
}
