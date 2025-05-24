import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CustomGPX from "./CustomGPX";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { FaMapMarkedAlt, FaRoute, FaMap, FaCog } from "react-icons/fa";
import { FiLayers } from "react-icons/fi";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapReady({ setLeafletMap, mapRef, showNames, showWaypoints, gpxLayersRef }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    setLeafletMap(map);
    gpxLayersRef.current = [];

    const apiBase = import.meta.env.PROD
      ? "https://mytrailmapsworker.jamesbrock25.workers.dev/api"
      : "/api";

    fetch(`${apiBase}/admin-gpx-list`)
      .then((res) => res.json())
      .then((tracks) => {
        tracks.forEach((track) => {
          const url = `${apiBase}/admin-gpx/${track.slug}`;

          fetch(url)
            .then((res) => res.text())
            .then((gpxText) => {
              const gpxLayer = new CustomGPX(gpxText, {
                polyline_options: {
                  color: "#3388ff",
                  weight: 3,
                },
                showTrackNames: showNames,
                showWaypoints: showWaypoints,
              });

              gpxLayer.on("loaded", (e) => {
                map.fitBounds(e.bounds);
              });

              gpxLayer.addTo(map);
              gpxLayersRef.current.push(gpxLayer);
            });
        });
      });
  }, [map, setLeafletMap]);

  return null;
}

function App() {
  const [leafletMap, setLeafletMap] = useState(null);
  const [activeTab, setActiveTab] = useState("map");
  const [showNames, setShowNames] = useState(true);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [showOverlaysPanel, setShowOverlaysPanel] = useState(false);
  const [overlayPage, setOverlayPage] = useState("main");
  const mapRef = useRef();
  const gpxLayersRef = useRef([]);

  useEffect(() => {
    gpxLayersRef.current.forEach((layer) => {
      layer.setShowTrackNames(showNames);
    });
  }, [showNames]);

  useEffect(() => {
    gpxLayersRef.current.forEach((layer) => {
      layer.setShowWaypoints(showWaypoints);
    });
  }, [showWaypoints]);

  const refreshGPXTracks = async () => {
    if (!leafletMap) return;

    const apiBase = import.meta.env.PROD
      ? 'https://mytrailmapsworker.jamesbrock25.workers.dev/api'
      : '/api';

    gpxLayersRef.current.forEach((layer) => leafletMap.removeLayer(layer));
    gpxLayersRef.current = [];

    try {
      const res = await fetch(`${apiBase}/admin-gpx-list`);
      const tracks = await res.json();

      for (const track of tracks) {
        const gpxRes = await fetch(`${apiBase}/admin-gpx/${track.slug}`);
        const gpxText = await gpxRes.text();

        const gpxLayer = new CustomGPX(gpxText, {
          polyline_options: { color: '#3388ff', weight: 3 },
          showTrackNames: showNames,
          showWaypoints: showWaypoints,
        });

        gpxLayer.on('loaded', (e) => {
          leafletMap.fitBounds(e.bounds);
        });

        gpxLayer.addTo(leafletMap);
        gpxLayersRef.current.push(gpxLayer);
      }

      console.log('🔄 GPX tracks refreshed after reconnect.');
    } catch (err) {
      console.error('❌ Error refreshing GPX tracks:', err);
    }
  };

  useEffect(() => {
    const onReconnect = () => {
      console.log("🔄 Reconnected — refreshing GPX list and map.");
      refreshGPXTracks();
    };

    window.addEventListener("online", onReconnect);
    return () => window.removeEventListener("online", onReconnect);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white shadow">
        <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {activeTab === "map" && (
          <MapContainer
            center={[37.8, -96]}
            zoom={4}
            className="absolute inset-0 z-0"
            whenCreated={(map) => setLeafletMap(map)}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapReady
              setLeafletMap={setLeafletMap}
              mapRef={mapRef}
              showNames={showNames}
              showWaypoints={showWaypoints}
              gpxLayersRef={gpxLayersRef}
            />
          </MapContainer>
        )}

        {/* Floating Map Overlay Button */}
        <button
          onClick={() => {
            setShowOverlaysPanel(true);
            setOverlayPage("main");
          }}
          className="absolute z-50 bottom-20 left-4 p-3 bg-green-600 text-white rounded-full shadow-lg"
        >
          <FiLayers className="text-xl" />
        </button>

        {/* Bottom Sheet */}
        {showOverlaysPanel && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 rounded-t-2xl shadow-xl max-h-[70%]">
            <div className="flex items-center justify-between p-4 border-b">
              {overlayPage !== "main" && (
                <button onClick={() => setOverlayPage("main")} className="text-green-700">←</button>
              )}
              <h3 className="text-lg font-semibold">{overlayPage === "main" ? "Maps" : "Map Overlays"}</h3>
              <button onClick={() => setShowOverlaysPanel(false)} className="text-gray-600 text-2xl">×</button>
            </div>

            {overlayPage === "main" && (
              <div className="p-4 space-y-4">
                <button onClick={() => setOverlayPage("overlays")} className="w-full p-3 bg-gray-100 rounded-lg font-semibold text-left text-green-700">Map Overlays</button>
                <button className="w-full p-3 bg-gray-100 rounded-lg font-semibold text-left text-green-700">Save Offline Maps</button>
              </div>
            )}

            {overlayPage === "overlays" && (
              <div className="p-4 space-y-3">
                <label className="flex justify-between items-center">
                  <span>Tracks</span>
                  <input type="checkbox" checked={true} readOnly className="toggle" />
                </label>
                <label className="flex justify-between items-center">
                  <span>Track Names</span>
                  <input type="checkbox" checked={showNames} onChange={() => setShowNames(!showNames)} className="toggle" />
                </label>
                <label className="flex justify-between items-center">
                  <span>Waypoints</span>
                  <input type="checkbox" checked={showWaypoints} onChange={() => setShowWaypoints(!showWaypoints)} className="toggle" />
                </label>
                <label className="flex justify-between items-center">
                  <span>Waypoint Labels</span>
                  <input type="checkbox" checked={showNames} onChange={() => setShowNames(!showNames)} className="toggle" />
                </label>
                <label className="flex justify-between items-center">
                  <span>Public Tracks</span>
                  <input type="checkbox" checked={true} readOnly className="toggle" />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center border-t border-gray-300 bg-white h-14">
        <button onClick={() => setActiveTab("map")} className="flex flex-col items-center text-xs">
          <FaMapMarkedAlt className="text-lg" />
          <span>Map</span>
        </button>
        <button onClick={() => setActiveTab("trip")} className="flex flex-col items-center text-xs">
          <FaRoute className="text-lg" />
          <span>Trip</span>
        </button>
        <button onClick={() => setActiveTab("tracks")} className="flex flex-col items-center text-xs">
          <FaMap className="text-lg" />
          <span>My Tracks</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className="flex flex-col items-center text-xs">
          <FaCog className="text-lg" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

export default App;
