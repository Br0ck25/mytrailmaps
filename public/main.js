import * as L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";


const map = L.map("map", {
  zoomControl: false, // turn off default position
}).fitWorld();

// Re-add zoom control to bottom right
L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const trail = [];
let polyline = null;

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

document.getElementById("export-btn").addEventListener("click", () => {
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
  cif (window.loadedTrackLayer) {
  map.removeLayer(window.loadedTrackLayer);
}
window.loadedTrackLayer = L.geoJSON(geojson, {
  style: { color: "green", weight: 4 }
}).addTo(map);
map.fitBounds(window.loadedTrackLayer.getBounds());

  // Optional: Display it on map (we can add this too)
};
document.getElementById("save-btn").addEventListener("click", () => {
  const geojson = {
    type: "FeatureCollection",
    features: trail.map(([lat, lng]) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
    })),
  };
  saveTrack(geojson);
});

document.getElementById("load-btn").addEventListener("click", async () => {
  const id = document.getElementById("load-id").value.trim();
  if (!id) return alert("Enter a Track ID");
  await loadTrack(id); // You can update this to draw it on the map
});
