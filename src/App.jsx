import { useState, useEffect, useRef } from "react";
import MapView from "./MapView";
import { FaMapMarkedAlt, FaRoute, FaMap, FaCog } from "react-icons/fa";
import { FiLayers, FiCrosshair } from "react-icons/fi";

function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [showTracks, setShowTracks] = useState(() => localStorage.getItem("showTracks") !== "false");
  const [showNames, setShowNames] = useState(() => localStorage.getItem("showNames") !== "false");
  const [showWaypoints, setShowWaypoints] = useState(() => localStorage.getItem("showWaypoints") !== "false");
  const [showWaypointLabels, setShowWaypointLabels] = useState(() => localStorage.getItem("showWaypointLabels") !== "false");
  const [showOverlaysPanel, setShowOverlaysPanel] = useState(false);
  const [overlayPage, setOverlayPage] = useState("main");
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
            />
          </div>
        )}

        <button
          onClick={() => {
            setShowOverlaysPanel(true);
            setOverlayPage("main");
          }}
          className="absolute z-50 bottom-20 left-4 p-3 bg-green-600 text-white rounded-full shadow-lg"
        >
          <FiLayers className="text-xl" />
        </button>

        <button
  onClick={() => triggerGeolocate?.()}
  className="absolute z-50 bottom-36 left-4 p-3 bg-green-600 text-white rounded-full shadow-lg"
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
              <div className="p-4 space-y-3">
                <label className="flex justify-between items-center">
                  <span>Tracks</span>
                  <input
                    type="checkbox"
                    checked={showTracks}
                    onChange={(e) => setShowTracks(e.target.checked)}
                    className="toggle"
                  />
                </label>
                <label className="flex justify-between items-center">
                  <span>Track Names</span>
                  <input
                    type="checkbox"
                    checked={showNames}
                    onChange={(e) => setShowNames(e.target.checked)}
                    className="toggle"
                  />
                </label>
                <label className="flex justify-between items-center">
                  <span>Waypoints</span>
                  <input
                    type="checkbox"
                    checked={showWaypoints}
                    onChange={(e) => setShowWaypoints(e.target.checked)}
                    className="toggle"
                  />
                </label>
                <label className="flex justify-between items-center">
                  <span>Waypoint Labels</span>
                  <input
                    type="checkbox"
                    checked={showWaypointLabels}
                    onChange={(e) => setShowWaypointLabels(e.target.checked)}
                    className="toggle"
                  />
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
