import { useState, useEffect, useRef } from "react";
import MapView from "./MapView";
import ToggleSwitch from "./components/ToggleSwitch";
import { FaMapMarkedAlt, FaRoute, FaMap, FaCog, FaDownload } from "react-icons/fa";
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
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
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
  const [showTripNameModal, setShowTripNameModal] = useState(false);
  const [pendingTripCoords, setPendingTripCoords] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedName, setEditedName] = useState("");
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => localStorage.setItem("showTracks", showTracks), [showTracks]);
  useEffect(() => localStorage.setItem("showNames", showNames), [showNames]);
  useEffect(() => localStorage.setItem("showWaypoints", showWaypoints), [showWaypoints]);
  useEffect(() => localStorage.setItem("showWaypointLabels", showWaypointLabels), [showWaypointLabels]);
  useEffect(() => localStorage.setItem("showPublicTracks", showPublicTracks), [showPublicTracks]);

   function deleteTrack(index) {
    const updated = [...userTracks];
    updated.splice(index, 1);
    setUserTracks(updated);
    localStorage.setItem("userTracks", JSON.stringify(updated));
  }

  function exportTrack(track) {
    const blob = new Blob([JSON.stringify(track, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${track.properties?.name || "trip"}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startTrip() {
    setTracking(true);
    setPaused(false);
    setTripCoords([]);
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);
    setDistance(0);

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - now) / 1000));
    }, 1000);

    startGeolocationWatcher();
  }

  function startGeolocationWatcher() {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setTripCoords(prev => {
            const updated = [...prev, [pos.coords.longitude, pos.coords.latitude]];
            if (updated.length > 1) {
              const d = getDistanceFromCoords(updated[updated.length - 2], updated[updated.length - 1]);
              setDistance(prevDist => prevDist + d);
            }
            return updated;
          });
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  }

  function pauseTrip() {
    setPaused(true);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function resumeTrip() {
    setPaused(false);
    const resumeStart = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - resumeStart) / 1000));
    }, 1000);
    startGeolocationWatcher();
  }

  function stopTrip() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPaused(false);
    setTracking(false);
    if (tripCoords.length > 1) {
      setPendingTripCoords(tripCoords);
      setShowTripNameModal(true);
      setEditedName("");
    }
  }

  function saveTrip(name) {
    if (!name.trim() || pendingTripCoords.length < 2) return;
    const newTrack = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: pendingTripCoords },
      properties: {
        name: name.trim(),
        stroke: "#FF0000",
        createdAt: Date.now(),
        distance: distance.toFixed(2),
        duration: elapsed
      }
    };
    const updatedTracks = [...userTracks, newTrack];
    setUserTracks(updatedTracks);
    localStorage.setItem("userTracks", JSON.stringify(updatedTracks));
    setPendingTripCoords([]);
    setShowTripNameModal(false);
    setActiveTab("tracks");
  }

  function getDistanceFromCoords(coord1, coord2) {
    const toRad = (val) => (val * Math.PI) / 180;
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c / 1609.34;
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  }
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      <div className={`flex justify-between items-center p-4 border-b border-gray-300 bg-white shadow ${activeTab === 'map' ? 'hidden' : ''}`}>
        <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className={activeTab === "map" ? "block" : "hidden"}>
          <MapView
            showNames={showNames}
            showWaypoints={showWaypoints}
            showWaypointLabels={showWaypointLabels}
            showTracks={showTracks}
            showPublicTracks={showPublicTracks}
            onGeolocateControlReady={setTriggerGeolocate}
            liveTrack={tracking ? tripCoords : null}
            userTracks={userTracks}
            tileJson={tileJson}
          />
        </div>

        {/* Trip Tab */}
  {activeTab === "trip" && (
  <div className="p-4 space-y-4 flex flex-col items-center">
    <button
      onClick={startTrip}
      disabled={tracking}
      className={`w-64 p-3 rounded-lg font-semibold text-center ${
        tracking ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-green-700"
      }`}
    >
      Start Trip
    </button>
    <button
      onClick={stopTrip}
      className="w-64 p-3 bg-red-100 rounded-lg font-semibold text-center text-red-700"
    >
      Stop Trip
    </button>



            {tracking && (
              <div className="text-center mt-2 text-sm text-gray-700 space-y-2">
                <p>Tracking for: <span className="font-semibold">{formatTime(elapsed)}</span></p>
                <p>Distance: <span className="font-semibold">{distance.toFixed(2)} mi</span></p>
                {!paused ? (
                  <button onClick={pauseTrip} className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-semibold">
                    Pause
                  </button>
                ) : (
                  <button onClick={resumeTrip} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                    Resume
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tracks Tab */}
        {activeTab === "tracks" && (
          <div className="p-4 space-y-4 overflow-y-auto flex flex-col items-center">
            {userTracks.length === 0 ? (
              <p className="text-gray-600">No saved trips yet.</p>
            ) : (
              [...userTracks].sort((a, b) => (b.properties.createdAt || 0) - (a.properties.createdAt || 0)).map((track, idx) => (
                <div key={idx} className="w-full max-w-md bg-gray-100 rounded-lg p-3 flex items-center justify-between">
                  {editingIndex === idx ? (
                    <>
                      <input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 mr-3 p-2 border border-gray-300 rounded"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => updateTrackName(idx, editedName)} className="text-green-600 font-semibold">Save</button>
                        <button onClick={() => setEditingIndex(null)} className="text-gray-600">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h4 className="font-bold text-green-700">{track.properties.name}</h4>
                        <p className="text-sm text-gray-600">
                          {track.properties.distance ? `${track.properties.distance} mi` : ""}{" "}
                          {track.properties.duration ? `• ${formatTime(track.properties.duration)}` : ""}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(track.properties.createdAt || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4 pl-4">
                        <button onClick={() => { setEditingIndex(idx); setEditedName(track.properties.name); }} className="text-blue-600">Edit</button>
                        <button onClick={() => exportTrack(track)} className="text-green-700" title="Export"><FaDownload className="text-xl" /></button>
                        <button onClick={() => setConfirmDeleteIndex(idx)} className="text-red-700 font-bold text-xl" title="Delete">✕</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Map Overlay Button */}
        <button onClick={() => { setShowOverlaysPanel(true); setOverlayPage("main"); }} className="absolute z-50 bottom-20 left-4 p-3 bg-white text-black rounded-full shadow-lg">
          <FiLayers className="text-xl" />
        </button>

        {/* Geolocate Button */}
        <button onClick={() => { if (typeof triggerGeolocate === "function") triggerGeolocate(); }} className="absolute z-50 bottom-32 left-4 p-3 bg-white text-black rounded-full shadow-lg" aria-label="Locate Me">
          <FiCrosshair className="text-xl" />
        </button>

        {/* Overlay Panel */}
        {showOverlaysPanel && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 rounded-t-2xl shadow-xl max-h-[70%]">
            <div className="flex items-center justify-between p-4 border-b">
              {overlayPage !== "main" && (
                <button onClick={() => setOverlayPage("main")} className="text-green-700 text-3xl leading-none px-2" aria-label="Back">←</button>
              )}
              <h3 className="text-lg font-semibold">{overlayPage === "main" ? "Maps" : "Map Overlays"}</h3>
              <button onClick={() => setShowOverlaysPanel(false)} className="text-gray-600 text-3xl leading-none px-2" aria-label="Close">×</button>
            </div>

            {overlayPage === "main" && (
  <div className="p-4">
    <div className="space-y-4 flex flex-col items-center">
      <button
        onClick={() => setOverlayPage("overlays")}
        className="w-64 p-3 bg-gray-100 rounded-lg font-semibold text-center text-green-700"
      >
        Map Overlays
      </button>
      <button
        className="w-64 p-3 bg-gray-100 rounded-lg font-semibold text-center text-green-700"
      >
        Save Offline Maps
      </button>
    </div>
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

        {/* Save Trip Modal */}
        {showTripNameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-80 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-green-700">Name Your Trip</h2>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="e.g. Weekend Ride"
                className="w-full p-2 border border-gray-300 rounded-lg"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => { setEditedName(""); setShowTripNameModal(false); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
                <button onClick={() => { if (editedName.trim()) { saveTrip(editedName); setEditedName(""); } }} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Trip Confirm */}
        {confirmDeleteIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-80 p-6 space-y-4 text-center">
              <h2 className="text-lg font-semibold text-red-600">Delete Trip</h2>
              <p className="text-gray-700">Are you sure you want to delete <strong>{userTracks[confirmDeleteIndex].properties.name}</strong>?</p>
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={() => setConfirmDeleteIndex(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
                <button onClick={() => { deleteTrack(confirmDeleteIndex); setConfirmDeleteIndex(null); }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
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
