import L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";

const map = L.map("map").fitWorld();
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
// 🔗 Replace YOUR_SUBDOMAIN with your actual worker subdomain
const saveTrack = async (geojson) => {
  const res = await fetch("https://mytrailmapsworker.YOUR_SUBDOMAIN.workers.dev/save", {
    method: "POST",
    body: JSON.stringify(geojson),
  });
  const { id } = await res.json();
  alert("Track saved! ID: " + id);
};

const loadTrack = async (id) => {
  const res = await fetch(`https://mytrailmapsworker.YOUR_SUBDOMAIN.workers.dev/load/${id}`);
  const geojson = await res.json();
  console.log("Loaded track:", geojson);
  // Optional: Display it on map (we can add this too)
};

