import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-gpx";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapReady({ setLeafletMap, mapRef }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    setLeafletMap(map);

    const apiBase = import.meta.env.PROD
      ? "https://mytrailmapsworker.jamesbrock25.workers.dev"
      : "/api";

    fetch(`${apiBase}/admin-gpx-list`)
      .then((res) => res.json())
      .then((tracks) => {
        tracks.forEach((track) => {
          const url = `${apiBase}/admin-gpx/${track.slug}`;

          fetch(url)
            .then((res) => res.text())
            .then((gpxText) => {
              const gpxLayer = new L.GPX(gpxText, {
                async: true,
                marker_options: {
                  startIconUrl: null,
                  endIconUrl: null,
                  shadowUrl: null,
                },
                polyline_options: {
                  color: "#3388ff",
                  weight: 3,
                },
                parseElements: ["track"],
              });

              gpxLayer._addWaypoints = () => {};
              gpxLayer.bindPopup = () => {};

              gpxLayer.on("loaded", (e) => {
                map.fitBounds(e.target.getBounds());

                const parser = new DOMParser();
                const xml = parser.parseFromString(gpxText, "application/xml");
                const namespace = "http://www.topografix.com/GPX/1/1";
                const waypointEls = [
                  ...xml.getElementsByTagNameNS(namespace, "wpt"),
                ];

                waypointEls.forEach((wpt) => {
                  const lat = parseFloat(wpt.getAttribute("lat"));
                  const lon = parseFloat(wpt.getAttribute("lon"));
                  const name =
                    wpt.getElementsByTagNameNS(namespace, "name")[0]
                      ?.textContent || "Unnamed";
                  const desc =
                    wpt.getElementsByTagNameNS(namespace, "desc")[0]
                      ?.textContent || "";

                  L.marker([lat, lon])
                    .addTo(map)
                    .bindPopup(`<strong>${name}</strong><br>${desc}`);
                });
              });

              gpxLayer.on("error", (err) => {
                console.error("❌ Error loading GPX:", track.slug, err);
              });

              gpxLayer.addTo(map);
            });
        });
      });
  }, [map, setLeafletMap]);

  return null;
}

function App() {
  const [leafletMap, setLeafletMap] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("map");
  const mapRef = useRef();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-gray-100 w-64 p-4 space-y-4 border-r border-gray-300 transition-all duration-300 ease-in-out ${
          menuOpen ? "block" : "hidden md:block"
        }`}
      >
        <h1 className="text-2xl font-bold text-green-700">MyTrailMaps</h1>
        <nav className="space-y-2">
          <button
            onClick={() => setActivePanel("map")}
            className="block w-full text-left hover:underline"
          >
            Map View
          </button>
          <button
            onClick={() => setActivePanel("tracks")}
            className="block w-full text-left hover:underline"
          >
            My Tracks
          </button>
          <button
            onClick={() => setActivePanel("upload")}
            className="block w-full text-left hover:underline"
          >
            Upload Track
          </button>
          <button
            onClick={() => setActivePanel("account")}
            className="block w-full text-left hover:underline"
          >
            My Account
          </button>
          <button
            onClick={() => setActivePanel("subscription")}
            className="block w-full text-left hover:underline text-green-600"
          >
            Subscription
          </button>
          <button className="block w-full text-left text-red-500 hover:underline">
            Sign Out
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white shadow">
          <h2 className="text-xl font-semibold capitalize">{activePanel}</h2>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            ☰
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {activePanel === "map" && (
            <>
              <p className="text-xs text-red-500 px-4">Panel: {activePanel}</p>
              <MapContainer
                center={[37.8, -96]}
                zoom={4}
                style={{ height: "100vh", width: "100%" }}
                whenCreated={(map) => setLeafletMap(map)}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapReady setLeafletMap={setLeafletMap} mapRef={mapRef} />
              </MapContainer>
              <p className="text-green-600 text-sm px-4">
                ✅ Map attempted to render
              </p>
            </>
          )}

          {activePanel === "tracks" && (
            <div className="p-4 space-y-4">
              <h3 className="text-2xl font-semibold mb-2">📁 My Tracks</h3>
              <div className="bg-white shadow rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">Rush Offroad</h4>
                    <p className="text-sm text-gray-500">
                      Uploaded: May 22, 2025
                    </p>
                  </div>
                  <div className="space-x-2">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                      Download
                    </button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">Wildcat Park Loop</h4>
                    <p className="text-sm text-gray-500">
                      Uploaded: May 20, 2025
                    </p>
                  </div>
                  <div className="space-x-2">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                      Download
                    </button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm italic">
                Next: Load these from Cloudflare KV
              </p>
            </div>
          )}

          {activePanel === "upload" && (
            <div className="p-4">📤 Upload a Track: Coming Soon</div>
          )}
          {activePanel === "account" && (
            <div className="p-4">👤 My Account: Coming Soon</div>
          )}
          {activePanel === "subscription" && (
            <div className="p-4">💳 Subscription Details: Coming Soon</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
