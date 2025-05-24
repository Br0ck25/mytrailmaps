import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CustomGPX from "./CustomGPX";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { FaMapMarkedAlt, FaRoute, FaMap, FaCog } from "react-icons/fa";

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
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white shadow">
          <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === "map" && (
            <MapContainer
              center={[37.8, -96]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
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

          {activeTab === "trip" && (
            <div className="p-4">Trip info will go here.</div>
          )}

          {activeTab === "tracks" && (
            <div className="p-4">My Tracks will be listed here.</div>
          )}

          {activeTab === "settings" && (
            <div className="p-4">Settings options will go here.</div>
          )}
        </div>

        <div className="flex justify-around items-center border-t border-gray-300 bg-white h-14">
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
    </div>
  );
}

export default App;