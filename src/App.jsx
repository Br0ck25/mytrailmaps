import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CustomGPX from "./CustomGPX";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

function SidePanel({ title, children, onClose }) {
  return (
    <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-lg z-[1000]">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="text-gray-600 text-2xl leading-none">×</button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">{children}</div>
    </div>
  );
}


function App() {
  const [leafletMap, setLeafletMap] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [showNames, setShowNames] = useState(true);
  const [showWaypoints, setShowWaypoints] = useState(true);
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

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`bg-gray-100 w-64 p-4 space-y-4 border-r border-gray-300 transition-all duration-300 ease-in-out ${
          menuOpen ? "block" : "hidden md:block"
        }`}
      >
        <h1 className="text-2xl font-bold text-green-700">MyTrailMaps</h1>
        <nav className="space-y-2">
          <button onClick={() => setOpenPanel(openPanel === "map" ? null : "map")} className="block w-full text-left hover:underline">
            Map View
          </button>
          <button onClick={() => setOpenPanel(openPanel === "tracks" ? null : "tracks")} className="block w-full text-left hover:underline">
            My Tracks
          </button>
          <button onClick={() => setOpenPanel(openPanel === "upload" ? null : "upload")} className="block w-full text-left hover:underline">
            Upload Track
          </button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white shadow">
          <h2 className="text-xl font-semibold capitalize">Map</h2>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            ☰
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <MapContainer
            center={[37.8, -96]}
            zoom={4}
            style={{ height: "100vh", width: "100%" }}
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
        </div>
      </div>

      {openPanel === "map" && (
        <SidePanel title="Map Overlays" onClose={() => setOpenPanel(null)}>
          <label className="flex items-center justify-between">
            <span>Waypoints</span>
            <input
              type="checkbox"
              checked={showWaypoints}
              onChange={() => setShowWaypoints(!showWaypoints)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Track Names</span>
            <input
              type="checkbox"
              checked={showNames}
              onChange={() => setShowNames(!showNames)}
            />
          </label>
        </SidePanel>
      )}

      {openPanel === "tracks" && (
        <SidePanel title="My Tracks" onClose={() => setOpenPanel(null)}>
          <p className="text-sm text-gray-600">Here you can view, download, or delete your tracks.</p>
        </SidePanel>
      )}

      {openPanel === "upload" && (
        <SidePanel title="Upload Track" onClose={() => setOpenPanel(null)}>
          <p className="text-sm text-gray-600">Track upload UI coming soon...</p>
        </SidePanel>
      )}
    </div>
  );
}

export default App;
