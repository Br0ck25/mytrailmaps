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
  (err) => alert("Location error: " + err.message),
  { enableHighAccuracy: true }
);
