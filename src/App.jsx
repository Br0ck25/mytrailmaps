import { useState, useEffect, useRef } from "react";
import MapView from "./MapView";
import ToggleSwitch from "./components/ToggleSwitch";
import { FaMapMarkedAlt, FaRoute, FaMap, FaCog, FaDownload } from "react-icons/fa";
import { FiLayers, FiCrosshair } from "react-icons/fi";

function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [showTracks, setShowTracks] = useState(() => localStorage.getItem("showTracks") !== "false");
  const [showNames, setShowNames] = useState(() => localStorage.getItem("showNames") !== "false");
  const [showWaypoints, setShowWaypoints] = useState(() => localStorage.getItem("showWaypoints") !== "false");
  const [showWaypointLabels, setShowWaypointLabels] = useState(() => localStorage.getItem("showWaypointLabels") !== "false");
  const [showPublicTracks, setShowPublicTracks] = useState(() => localStorage.getItem("showPublicTracks") !== "false");
  const [showOverlaysPanel, setShowOverlaysPanel] = useState(false);
  const [overlayPage, setOverlayPage] = useState("main");
  const [triggerGeolocate, setTriggerGeolocate] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [tripCoords, setTripCoords] = useState([]);
  const [userTracks, setUserTracks] = useState(() => JSON.parse(localStorage.getItem("userTracks") || "[]"));
  const watchIdRef = useRef(null);

  useEffect(() => localStorage.setItem("showTracks", showTracks), [showTracks]);
  useEffect(() => localStorage.setItem("showNames", showNames), [showNames]);
  useEffect(() => localStorage.setItem("showWaypoints", showWaypoints), [showWaypoints]);
  useEffect(() => localStorage.setItem("showWaypointLabels", showWaypointLabels), [showWaypointLabels]);
  useEffect(() => localStorage.setItem("showPublicTracks", showPublicTracks), [showPublicTracks]);

  function startTrip() {
    setTracking(true);
    setTripCoords([]);
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setTripCoords(prev => [...prev, [pos.coords.longitude, pos.coords.latitude]]);
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  }

  function stopTrip() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    const name = prompt("Enter a name for your trip:");
    if (name && tripCoords.length > 1) {
      const newTrack = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: tripCoords },
        properties: { name, desc: "Custom recorded trip", stroke: "#FF0000" }
      };
      const updatedTracks = [...userTracks, newTrack];
      setUserTracks(updatedTracks);
      localStorage.setItem("userTracks", JSON.stringify(updatedTracks));
    }
  }

  function exportTrack(track) {
    const blob = new Blob([JSON.stringify(track, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${track.properties.name || "trip"}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      <div className={`flex justify-between items-center p-4 border-b border-gray-300 bg-white shadow ${activeTab === 'map' ? 'hidden' : ''}`}>
        <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {activeTab === "map" && (
          <div className="absolute inset-0 z-0">
            <MapView
              showNames={showNames}
              showWaypoints={showWaypoints}
              showWaypointLabels={showWaypointLabels}
              showTracks={showTracks}
              showPublicTracks={showPublicTracks}
              onGeolocateControlReady={setTriggerGeolocate}
              liveTrack={tracking ? tripCoords : null}
              userTracks={userTracks}
            />
          </div>
        )}

        {activeTab === "trip" && (
          <div className="p-4 space-y-4">
            <button onClick={startTrip} className="w-full p-3 bg-green-600 text-white rounded-lg">Start Trip</button>
            <button onClick={stopTrip} className="w-full p-3 bg-red-600 text-white rounded-lg">Stop Trip</button>
          </div>
        )}

        {activeTab === "tracks" && (
          <div className="p-4 space-y-4 overflow-y-auto">
            {userTracks.length === 0 ? (
              <p className="text-gray-600">No saved trips yet.</p>
            ) : (
              userTracks.map((track, idx) => (
                <div key={idx} className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-green-700">{track.properties.name}</h4>
                    <p className="text-sm text-gray-600">{track.properties.desc}</p>
                  </div>
                  <button onClick={() => exportTrack(track)} className="text-green-700" title="Export">
                    <FaDownload className="text-xl" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Floating Buttons */}
        <button
          onClick={() => {
            setShowOverlaysPanel(true);
            setOverlayPage("main");
          }}
          className="absolute z-50 bottom-20 left-4 p-3 bg-white text-black rounded-full shadow-lg"
        >
          <FiLayers className="text-xl" />
        </button>

        <button
          onClick={() => {
            if (typeof triggerGeolocate === "function") {
              triggerGeolocate();
            }
          }}
          className="absolute z-50 bottom-32 left-4 p-3 bg-white text-black rounded-full shadow-lg"
          aria-label="Locate Me"
        >
          <FiCrosshair className="text-xl" />
        </button>

        {showOverlaysPanel && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 rounded-t-2xl shadow-xl max-h-[70%]">
            <div className="flex items-center justify-between p-4 border-b">
              {overlayPage !== "main" && (
                <button onClick={() => setOverlayPage("main")} className="text-green-700 text-3xl leading-none px-2">←</button>
              )}
              <h3 className="text-lg font-semibold">{overlayPage === "main" ? "Maps" : "Map Overlays"}</h3>
              <button onClick={() => setShowOverlaysPanel(false)} className="text-gray-600 text-3xl leading-none px-2">×</button>
            </div>

            {overlayPage === "main" && (
              <div className="p-4 space-y-4">
                <button onClick={() => setOverlayPage("overlays")} className="w-full p-3 bg-gray-100 rounded-lg font-semibold text-left text-green-700">Map Overlays</button>
                <button className="w-full p-3 bg-gray-100 rounded-lg font-semibold text-left text-green-700">Save Offline Maps</button>
              </div>
            )}

            {overlayPage === "overlays" && (
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span>Tracks</span>
                  <ToggleSwitch checked={showTracks} onChange={(e) => setShowTracks(e.target.checked)} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Track Names</span>
                  <ToggleSwitch checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Waypoints</span>
                  <ToggleSwitch checked={showWaypoints} onChange={(e) => setShowWaypoints(e.target.checked)} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Waypoint Labels</span>
                  <ToggleSwitch checked={showWaypointLabels} onChange={(e) => setShowWaypointLabels(e.target.checked)} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Public Tracks</span>
                  <ToggleSwitch checked={showPublicTracks} onChange={(e) => setShowPublicTracks(e.target.checked)} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center border-t border-gray-300 bg-white h-14">
        <button onClick={() => setActiveTab("map")} className={`flex flex-col items-center text-xs ${activeTab === "map" ? "text-green-700 font-semibold" : "text-gray-600"}`}>
          <FaMapMarkedAlt className="text-lg" />
          <span>Map</span>
        </button>
        <button onClick={() => setActiveTab("trip")} className={`flex flex-col items-center text-xs ${activeTab === "trip" ? "text-green-700 font-semibold" : "text-gray-600"}`}>
          <FaRoute className="text-lg" />
          <span>Trip</span>
        </button>
        <button onClick={() => setActiveTab("tracks")} className={`flex flex-col items-center text-xs ${activeTab === "tracks" ? "text-green-700 font-semibold" : "text-gray-600"}`}>
          <FaMap className="text-lg" />
          <span>My Tracks</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center text-xs ${activeTab === "settings" ? "text-green-700 font-semibold" : "text-gray-600"}`}>
          <FaCog className="text-lg" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

export default App;
