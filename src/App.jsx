import { useState, useEffect, useRef } from "react";
import MapView from "./MapView";
import ToggleSwitch from "./components/ToggleSwitch";
import { FaMapMarkedAlt, FaRoute, FaMap, FaCog } from "react-icons/fa";
import { FiLayers, FiCrosshair } from "react-icons/fi";

const tileJson = {
  tilejson: "2.2.0",
  name: "Track Tiles",
  tiles: [
    `https://mytrailmaps.brocksville.com/tiles/trackdata/{z}/{x}/{y}.pbf?nocache=${Date.now()}`
  ],
  minzoom: 5,
  maxzoom: 15
};

function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [showTracks, setShowTracks] = useState(() => localStorage.getItem("showTracks") !== "false");
  const [showNames, setShowNames] = useState(() => localStorage.getItem("showNames") !== "false");
  const [showWaypoints, setShowWaypoints] = useState(() => localStorage.getItem("showWaypoints") !== "false");
  const [showWaypointLabels, setShowWaypointLabels] = useState(() => localStorage.getItem("showWaypointLabels") !== "false");
  const [showOverlaysPanel, setShowOverlaysPanel] = useState(false);
  const [overlayPage, setOverlayPage] = useState("main");
  const [triggerGeolocate, setTriggerGeolocate] = useState(null);
  const mapRef = useRef();

  useEffect(() => localStorage.setItem("showTracks", showTracks), [showTracks]);
  useEffect(() => localStorage.setItem("showNames", showNames), [showNames]);
  useEffect(() => localStorage.setItem("showWaypoints", showWaypoints), [showWaypoints]);
  useEffect(() => localStorage.setItem("showWaypointLabels", showWaypointLabels), [showWaypointLabels]);

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      <div className={`flex justify-between items-center p-4 border-b border-gray-300 bg-white shadow ${activeTab === 'map' ? 'hidden' : ''}`}>
        <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {activeTab === "map" && (
          <div className="absolute inset-0 z-0">
            <MapView
              mapRef={mapRef}
              showNames={showNames}
              showWaypoints={showWaypoints}
              showWaypointLabels={showWaypointLabels}
              showTracks={showTracks}
              onGeolocateControlReady={setTriggerGeolocate}
              tileJson={tileJson}
            />
          </div>
        )}

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
          onClick={() => triggerGeolocate?.()}
          className="absolute z-50 bottom-32 left-4 p-3 bg-white text-black rounded-full shadow-lg"
          aria-label="Locate Me"
        >
          <FiCrosshair className="text-xl" />
        </button>

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
                <div className="flex justify-between items-center opacity-50">
                  <span>Public Tracks</span>
                  <ToggleSwitch checked={true} onChange={() => {}} />
                </div>
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
