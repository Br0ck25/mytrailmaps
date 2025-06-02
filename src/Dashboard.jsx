// src/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import MapView from "./MapView";
import ToggleSwitch from "./components/ToggleSwitch";
import { FaMapMarkedAlt, FaRoute, FaMap, FaCog, FaDownload } from "react-icons/fa";
import { FiLayers, FiCrosshair } from "react-icons/fi";
import * as toGeoJSON from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import maplibregl from "maplibre-gl";
import localforage from "localforage";
import { useNavigate } from "react-router-dom";

localforage.config({
  name: 'MyTrailMaps',
  storeName: 'trail_data'
});

const tileJson = {
  tilejson: "2.2.0",
  name: "Track Tiles",
  tiles: [
    `https://mytrailmaps.brocksville.com/tiles/trackdata/{z}/{x}/{y}.pbf?nocache=${Date.now()}`
  ],
  minzoom: 5,
  maxzoom: 15
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook: call /api/subscription-status once at mount and whenever `userEmail`
// changes. Returns "free" or "paid", or null while loading.
// ─────────────────────────────────────────────────────────────────────────────
function useSubscriptionStatus(userEmail) {
  const [status, setStatus] = useState(null); // null = checking…; "free" or "paid"
  useEffect(() => {
    if (!userEmail) {
      setStatus("free");
      return;
    }
    setStatus(null);
    fetch(`/api/subscription-status?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((json) => {
        setStatus(json.status || "free");
      })
      .catch(() => {
        setStatus("free");
      });
  }, [userEmail]);
  return status;
}

export default function Dashboard({ onLogout }) {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1) Grab logged‐in userEmail from localStorage
  //    (Ensure you set this at login or signup: localStorage.setItem("userEmail", userEmail))
  // ─────────────────────────────────────────────────────────────────────────────
  const userEmail = localStorage.getItem("userEmail") || "";

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) Call our hook to ask the Worker: “free” or “paid”?
  // ─────────────────────────────────────────────────────────────────────────────
  const subscriptionStatus = useSubscriptionStatus(userEmail);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3) While checking subscription status, show a loading state
  // ─────────────────────────────────────────────────────────────────────────────
  if (subscriptionStatus === null) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-600">Checking subscription status…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4) If user is free, show an “Upgrade” prompt
  // ─────────────────────────────────────────────────────────────────────────────
  if (subscriptionStatus === "free") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Upgrade to Premium
        </h2>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          Free accounts can create and import their own tracks, but paid subscribers
          get access to all official Tracks & Parks, plus offline maps and other
          premium features.
        </p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={async () => {
              const priceId = "price_1HxYYY_monthly"; // ← replace with your real monthly price ID
              const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, userEmail }),
              });
              const { checkoutUrl } = await res.json();
              window.location.href = checkoutUrl;
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            Subscribe $5.99 / month
          </button>
          <button
            onClick={async () => {
              const priceId = "price_1HxYYY_yearly"; // ← replace with your real yearly price ID
              const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, userEmail }),
              });
              const { checkoutUrl } = await res.json();
              window.location.href = checkoutUrl;
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Subscribe $60 / year
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5) If we reach here, subscriptionStatus === "paid"
  //    → Render the rest of the Dashboard (map, trip, tracks, settings)
  // ─────────────────────────────────────────────────────────────────────────────

  // --- Trip & Timing States ---
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [paused, setPaused] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentElevation, setCurrentElevation] = useState(null);

  // --- Delete Confirm States ---
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null);

  // --- Folder Rename States ---
  const [folderRenameTarget, setFolderRenameTarget] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");

  // --- Tab & Overlay States (initialize from localStorage) ---
  const [activeTab, setActiveTab] = useState("map");
  const [showTracks, setShowTracks] = useState(() => {
    const stored = localStorage.getItem("showTracks");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [showNames, setShowNames] = useState(() => {
    const stored = localStorage.getItem("showNames");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [showWaypoints, setShowWaypoints] = useState(() => {
    const stored = localStorage.getItem("showWaypoints");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [showWaypointLabels, setShowWaypointLabels] = useState(() => {
    const stored = localStorage.getItem("showWaypointLabels");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [showPublicTracks, setShowPublicTracks] = useState(() => {
    const stored = localStorage.getItem("showPublicTracks");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [showOverlaysPanel, setShowOverlaysPanel] = useState(false);
  const [overlayPage, setOverlayPage] = useState("main");
  const [triggerGeolocate, setTriggerGeolocate] = useState(null);

  // --- Tracking & Trip States ---
  const [tracking, setTracking] = useState(false);
  const [tripCoords, setTripCoords] = useState([]);
  const [userTracks, setUserTracks] = useState([]);
  const [showTripNameModal, setShowTripNameModal] = useState(false);
  const [pendingTripCoords, setPendingTripCoords] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedName, setEditedName] = useState("");

  // --- Import Preview & Selection States ---
  const [importedPreview, setImportedPreview] = useState(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [confirmDeleteMultiple, setConfirmDeleteMultiple] = useState(false);

  // --- Folder Ordering State (initialize to empty) ---
  const [folderOrder, setFolderOrder] = useState([]);

  const [showConfirmDeleteAccount, setShowConfirmDeleteAccount] = useState(false);

  // --- Refs ---
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  // --- Utility: normalize folder name for comparisons ---
  function normalize(str) {
    return (str || "Ungrouped").trim().toLowerCase();
  }

  // --- Handlers for folder/track edits, now only update state ---
  function deleteFolder(name) {
    const norm = normalize(name);
    const updated = userTracks.filter(t => normalize(t.properties?.folderName) !== norm);
    setUserTracks(updated);
    setFolderOrder(prev => prev.filter(f => normalize(f) !== norm));
    setConfirmDeleteFolder(null);
  }

  function renameFolder(oldName, newName) {
    const normOld = normalize(oldName);
    const trimmedNew = newName.trim();
    if (!trimmedNew) return;
    const updatedTracks = userTracks.map(t => {
      if (normalize(t.properties?.folderName) === normOld) {
        return {
          ...t,
          properties: {
            ...t.properties,
            folderName: trimmedNew
          }
        };
      }
      return t;
    });
    setUserTracks(updatedTracks);
    setFolderOrder(prev => prev.map(f => (normalize(f) === normOld ? trimmedNew : f)));
    setFolderRenameTarget(null);
    setNewFolderName("");
  }

  function updateTrackName(index, newName) {
    const updated = [...userTracks];
    updated[index].properties.name = newName.trim();
    setUserTracks(updated);
    setEditingIndex(null);
  }

  function deleteTrack(index) {
    const updated = [...userTracks];
    updated.splice(index, 1);
    setUserTracks(updated);
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

  function exportFolder(folderName) {
    const featuresInFolder = userTracks.filter(
      (t) => t.properties?.folderName === folderName
    );
    if (!featuresInFolder.length) {
      alert(`No tracks found in folder "${folderName}".`);
      return;
    }
    const collection = {
      type: "FeatureCollection",
      features: featuresInFolder
    };
    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${folderName.replace(/\s+/g, "_") || "folder"}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const ext = file.name.split(".").pop().toLowerCase();
      const filenameBase = file.name.replace(/\.[^/.]+$/, "");
      let geojson = null;
      try {
        if (ext === "gpx" || ext === "kml") {
          const dom = new DOMParser().parseFromString(text, "application/xml");
          geojson = ext === "gpx" ? toGeoJSON.gpx(dom) : toGeoJSON.kml(dom);
        } else {
          geojson = JSON.parse(text);
        }
        if (!geojson || !geojson.features) throw new Error("Invalid format");
        const tracks = geojson.features.filter(f => f.geometry?.type === "LineString");
        const waypoints = geojson.features.filter(f => f.geometry?.type === "Point");
        const newFolderNameForImport = filenameBase;
        const newFolderId = nanoid();
        const withMeta = tracks.map((t, i) => ({
          ...t,
          properties: {
            ...t.properties,
            name: t.properties?.name || `${filenameBase} Track ${i + 1}`,
            stroke: t.properties?.stroke || "#FF0000",
            createdAt: Date.now(),
            folderName: newFolderNameForImport,
            folderId: newFolderId
          }
        }));
        setImportedPreview({
          folderName: newFolderNameForImport,
          folderId: newFolderId,
          tracks: withMeta,
          waypoints,
          selectedTrackIndexes: withMeta.map((_, i) => i)
        });
        setShowImportPreview(true);
      } catch (err) {
        alert("❌ Failed to parse file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
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
    return (R * c) / 1609.34;
  }

  function startGeolocationWatcher() {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const beginWatch = () => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const altMeters = pos.coords.altitude;
          const elevationFeet = altMeters != null ? altMeters * 3.28084 : null;
          setCurrentElevation(elevationFeet);
          const speedMps = pos.coords.speed;
          const speedMph = speedMps != null ? speedMps * 2.23694 : 0;
          setCurrentSpeed(speedMph);
          setTripCoords((prev) => {
            const updated = [...prev, [pos.coords.longitude, pos.coords.latitude]];
            if (updated.length > 1) {
              const d = getDistanceFromCoords(
                updated[updated.length - 2],
                updated[updated.length - 1]
              );
              setDistance((prevDist) => prevDist + d);
            }
            return updated;
          });
        },
        (err) => {
          if (err.code === err.TIMEOUT) {
            console.warn("Geolocation timeout: retrying in 1s...");
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            setTimeout(() => beginWatch(), 1000);
            return;
          }
          if (err.code === err.PERMISSION_DENIED) {
            console.error("Geolocation permission denied.");
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            console.error("Position unavailable.");
          } else {
            console.error("Geolocation error:", err.message);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 30000,
        }
      );
    };
    beginWatch();
  }

  function startTrip() {
    setTracking(true);
    setPaused(false);
    setTripCoords([]);
    setCurrentSpeed(0);
    setCurrentElevation(null);
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);
    setDistance(0);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - now) / 1000));
    }, 1000);
    startGeolocationWatcher();
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
        duration: elapsed,
        speed: currentSpeed.toFixed(2),
        elevation: currentElevation != null ? currentElevation.toFixed(0) : null,
        folderName: "Ungrouped",
        folderId: null
      }
    };
    const updatedTracks = [...userTracks, newTrack];
    setUserTracks(updatedTracks);
    if (!folderOrder.includes("Ungrouped")) {
      setFolderOrder(prev => [...prev, "Ungrouped"]);
    }
    setPendingTripCoords([]);
    setShowTripNameModal(false);
    setActiveTab("tracks");
  }

  function zoomToTrack(track) {
    const coords = track.geometry?.coordinates;
    if (coords && coords.length) {
      const bounds = coords.reduce(
        (b, coord) => b.extend(coord),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      setActiveTab("map");
      setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        mapRef.current?.resize();
        mapRef.current?.fitBounds(bounds, {
          padding: isMobile
            ? { top: 40, bottom: 40, left: 40, right: 40 }
            : { top: 40, bottom: 40, left: 100, right: 100 },
          maxZoom: 15
        });
      }, 250);
    }
  }

  // --- ACCOUNT SYNC LOGIC ---

  const token = localStorage.getItem("authToken") || "";

  useEffect(() => {
    async function loadAccount() {
      const localAccount = await localforage.getItem('userAccount');
      if (localAccount) {
        setUserTracks(localAccount.tracks || []);
        setFolderOrder(localAccount.folderOrder || []);
        if (localAccount.preferences) {
          setShowTracks(localAccount.preferences.showTracks ?? showTracks);
          setShowNames(localAccount.preferences.showNames ?? showNames);
          setShowWaypoints(localAccount.preferences.showWaypoints ?? showWaypoints);
          setShowWaypointLabels(localAccount.preferences.showWaypointLabels ?? showWaypointLabels);
          setShowPublicTracks(localAccount.preferences.showPublicTracks ?? showPublicTracks);
        }
      }
      if (!token) {
        onLogout();
        return;
      }
      if (navigator.onLine) {
        try {
          const res = await fetch("/api/get-account", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const json = await res.json();
          if (!res.ok) {
            if (res.status === 401) onLogout();
            return;
          }
          const { account } = json;
          setUserTracks(account.tracks || []);
          setFolderOrder(account.folderOrder || []);
          if (account.preferences) {
            setShowTracks(account.preferences.showTracks ?? showTracks);
            setShowNames(account.preferences.showNames ?? showNames);
            setShowWaypoints(account.preferences.showWaypoints ?? showWaypoints);
            setShowWaypointLabels(account.preferences.showWaypointLabels ?? showWaypointLabels);
            setShowPublicTracks(account.preferences.showPublicTracks ?? showPublicTracks);
          }
          await localforage.setItem('userAccount', account);
        } catch (err) {
          console.warn("Failed to fetch from server:", err);
        }
      }
    }
    loadAccount();
  }, [token, onLogout]);

  useEffect(() => {
    async function saveAccount() {
      if (!token) return;
      const account = {
        tracks: userTracks,
        folderOrder,
        preferences: {
          showTracks,
          showNames,
          showWaypoints,
          showWaypointLabels,
          showPublicTracks,
        },
      };
      await localforage.setItem('userAccount', account);
      if (navigator.onLine) {
        try {
          await fetch("/api/save-account", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ account }),
          });
        } catch (err) {
          console.error("Error saving account remotely:", err);
        }
      }
    }
    saveAccount();
  }, [
    token,
    userTracks,
    folderOrder,
    showTracks,
    showNames,
    showWaypoints,
    showWaypointLabels,
    showPublicTracks,
  ]);

  useEffect(() => {
    const forceLayoutUpdate = () => {
      document.body.style.height = `${window.innerHeight}px`;
    };
    forceLayoutUpdate();
    window.addEventListener("orientationchange", forceLayoutUpdate);
    window.addEventListener("resize", forceLayoutUpdate);
    return () => {
      window.removeEventListener("orientationchange", forceLayoutUpdate);
      window.removeEventListener("resize", forceLayoutUpdate);
    };
  }, []);

  // Persist each toggle to localStorage
  useEffect(() => {
    localStorage.setItem("showTracks", JSON.stringify(showTracks));
  }, [showTracks]);
  useEffect(() => {
    localStorage.setItem("showNames", JSON.stringify(showNames));
  }, [showNames]);
  useEffect(() => {
    localStorage.setItem("showWaypoints", JSON.stringify(showWaypoints));
  }, [showWaypoints]);
  useEffect(() => {
    localStorage.setItem("showWaypointLabels", JSON.stringify(showWaypointLabels));
  }, [showWaypointLabels]);
  useEffect(() => {
    localStorage.setItem("showPublicTracks", JSON.stringify(showPublicTracks));
  }, [showPublicTracks]);

  // Confirm & delete account
  async function confirmAndDeleteAccount() {
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!res.ok) {
        const json = await res.json();
        alert("❌ Failed to delete account: " + (json.error || res.statusText));
        return;
      }
      localStorage.removeItem("authToken");
      localStorage.removeItem("userEmail");
      onLogout();
      navigate("/signup");
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("❌ An error occurred while deleting your account.");
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* ─── Header (hidden on map tab) ─────────────────────────────────────────── */}
      <div
        className={`flex justify-between items-center p-4 border-b border-gray-300 bg-white shadow ${
          activeTab === "map" ? "hidden" : ""
        }`}
      >
        <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
      </div>

      {/* ─── Main Content Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* ─── Map View (only when activeTab === "map") ─────────────────────────── */}
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
            mapRef={mapRef}
          />

          {/* ─── Map Key Legend ──────────────────────────────────────────────── */}
          <div className="absolute top-4 left-4 z-40 bg-white rounded-xl shadow-md p-3 space-y-2 text-sm text-gray-800">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-6 h-1 rounded-full bg-green-600" />
              <span>Easy</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-6 h-1 rounded-full bg-blue-600" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-6 h-1 rounded-full bg-red-600" />
              <span>Hard</span>
            </div>
          </div>
        </div>

        {/* ─── Trip Tab ─────────────────────────────────────────────────────────── */}
        {activeTab === "trip" && (
          <div className="p-4 space-y-4 flex flex-col items-center">
            {/* Start / Stop Buttons */}
            <button
              onClick={startTrip}
              disabled={tracking}
              className={`w-64 p-3 rounded-lg font-semibold text-center ${
                tracking
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-green-700"
              }`}
            >
              Start Trip
            </button>
            <button
              onClick={stopTrip}
              className={`w-64 p-3 rounded-lg font-semibold text-center ${
                tracking
                  ? "bg-red-200 text-red-400 cursor-not-allowed"
                  : "bg-red-100 text-red-700"
              }`}
              disabled={!tracking}
            >
              Stop Trip
            </button>

            {/* Always show current speed & elevation */}
            <div className="text-center mt-2 text-sm text-gray-700 space-y-2">
              <p>
                Current Speed:{" "}
                <span className="font-semibold">
                  {currentSpeed.toFixed(2)} mph
                </span>
              </p>
              <p>
                Current Elevation:{" "}
                <span className="font-semibold">
                  {currentElevation != null
                    ? `${currentElevation.toFixed(0)} ft`
                    : "N/A"}
                </span>
              </p>
            </div>

            {/* Only while tracking, show elapsed time & distance + pause/resume */}
            {tracking && (
              <div className="text-center mt-2 text-sm text-gray-700 space-y-2">
                <p>
                  Tracking for:{" "}
                  <span className="font-semibold">{formatTime(elapsed)}</span>
                </p>
                <p>
                  Distance:{" "}
                  <span className="font-semibold">
                    {distance.toFixed(2)} mi
                  </span>
                </p>

                {/* Pause / Resume Buttons */}
                {!paused ? (
                  <button
                    onClick={pauseTrip}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-semibold"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeTrip}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold"
                  >
                    Resume
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── My Tracks Tab ───────────────────────────────────────────────────── */}
        {activeTab === "tracks" && (
          <div
            className="p-4 space-y-4 flex flex-col items-center pb-24"
            style={{ maxHeight: "calc(100vh - 3.5rem)", overflowY: "auto" }}
          >
            {/* Import Button */}
            <div className="w-full max-w-md flex justify-center mb-4">
              <label className="w-64 p-3 bg-gray-100 rounded-lg font-semibold text-center text-green-700 cursor-pointer">
                Import Track
                <input
                  type="file"
                  accept=".gpx,.kml,.geojson,.topojson,.json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            {/* Select All / Delete Selected */}
            {userTracks.length > 0 && (
              <div className="w-full max-w-md flex justify-between items-center mb-2 text-sm">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTracks.length === userTracks.length}
                    onChange={(e) => {
                      setSelectedTracks(
                        e.target.checked
                          ? userTracks.map((_, i) => i)
                          : []
                      );
                    }}
                  />
                  <span>Select All</span>
                </label>
                {selectedTracks.length > 0 && (
                  <button
                    onClick={() => setConfirmDeleteMultiple(true)}
                    className="text-red-600 font-semibold"
                  >
                    Delete Selected ({selectedTracks.length})
                  </button>
                )}
              </div>
            )}

            {/* No Tracks Message */}
            {userTracks.length === 0 ? (
              <p className="text-gray-600">No saved trips yet.</p>
            ) : (
              (() => {
                const grouped = userTracks.reduce((acc, track, idx) => {
                  const folder = track.properties?.folderName || "Ungrouped";
                  if (!acc[folder]) acc[folder] = [];
                  acc[folder].push({ track, idx });
                  return acc;
                }, {});

                const allFolders = Object.keys(grouped);
                const missing = allFolders.filter(f => !folderOrder.includes(f));
                if (missing.length) {
                  setFolderOrder(prev => [...prev, ...missing]);
                }

                return folderOrder.map(folder => {
                  if (!grouped[folder]) return null;
                  return (
                    <CollapsibleFolder
                      key={folder}
                      folderName={folder}
                      items={grouped[folder]}
                      selectedTracks={selectedTracks}
                      setSelectedTracks={setSelectedTracks}
                      editingIndex={editingIndex}
                      setEditingIndex={setEditingIndex}
                      editedName={editedName}
                      setEditedName={setEditedName}
                      updateTrackName={updateTrackName}
                      exportTrack={exportTrack}
                      setConfirmDeleteIndex={setConfirmDeleteIndex}
                      setConfirmDeleteFolder={setConfirmDeleteFolder}
                      zoomToTrack={zoomToTrack}
                      formatTime={formatTime}
                      setFolderRenameTarget={setFolderRenameTarget}
                      setNewFolderName={setNewFolderName}
                      exportFolder={exportFolder}
                    />
                  );
                });
              })()
            )}
          </div>
        )}

        {/* ─── Settings Tab ─────────────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <button
              onClick={onLogout}
              className="w-64 p-3 bg-gray-100 text-red-700 rounded-lg font-semibold text-center"
            >
              Log Out
            </button>

            <button
              onClick={() => setShowConfirmDeleteAccount(true)}
              className="w-64 p-3 bg-gray-100 text-red-700 rounded-lg font-semibold text-center mt-4"
            >
              Delete Account
            </button>
          </div>
        )}

        {/* ─── Delete Multiple Confirm Modal ──────────────────────────────────── */}
        {confirmDeleteMultiple && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-80 p-6 space-y-4 text-center">
              <h2 className="text-lg font-semibold text-red-600">Delete Tracks</h2>
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{selectedTracks.length}</strong> tracks?
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={() => setConfirmDeleteMultiple(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const updated = userTracks.filter((_, i) => !selectedTracks.includes(i));
                    setUserTracks(updated);
                    setSelectedTracks([]);
                    setConfirmDeleteMultiple(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Map Overlay Button (only on map tab) ──────────────────────────────── */}
        {activeTab === "map" && (
          <button
            onClick={() => { setShowOverlaysPanel(true); setOverlayPage("main"); }}
            className="absolute z-50 bottom-20 left-4 p-3 bg-white text-black rounded-full shadow-lg"
          >
            <FiLayers className="text-xl" />
          </button>
        )}

        {/* ─── Overlay Panel ─────────────────────────────────────────────────────── */}
        {showOverlaysPanel && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 rounded-t-2xl shadow-xl max-h-[70%]">
            <div className="flex items-center justify-between p-4 border-b">
              {overlayPage !== "main" && (
                <button onClick={() => setOverlayPage("main")} className="text-green-700 text-3xl leading-none px-2" aria-label="Back">
                  ←
                </button>
              )}
              <h3 className="text-lg font-semibold">{overlayPage === "main" ? "Maps" : "Map Overlays"}</h3>
              <button onClick={() => setShowOverlaysPanel(false)} className="text-gray-600 text-3xl leading-none px-2" aria-label="Close">
                ×
              </button>
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
                  <button className="w-64 p-3 bg-gray-100 rounded-lg font-semibold text-center text-green-700">
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

        {/* ─── Save Trip Modal ───────────────────────────────────────────────────── */}
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
                <button onClick={() => { setEditedName(""); setShowTripNameModal(false); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editedName.trim()) {
                      saveTrip(editedName);
                      setEditedName("");
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Delete Trip Confirm Modal ──────────────────────────────────────────── */}
        {confirmDeleteIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-80 p-6 space-y-4 text-center">
              <h2 className="text-lg font-semibold text-red-600">Delete Trip</h2>
              <p className="text-gray-700">
                Are you sure you want to delete{" "}
                <strong>{userTracks[confirmDeleteIndex].properties.name}</strong>?
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={() => setConfirmDeleteIndex(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={() => { deleteTrack(confirmDeleteIndex); setConfirmDeleteIndex(null); }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Delete Folder Confirm Modal ───────────────────────────────────────── */}
        {confirmDeleteFolder !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-80 p-6 space-y-4 text-center">
              <h2 className="text-lg font-semibold text-red-600">Delete Folder</h2>
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{confirmDeleteFolder}</strong> and all its tracks?
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={() => setConfirmDeleteFolder(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={() => deleteFolder(confirmDeleteFolder)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Rename Folder Modal ───────────────────────────────────────────────── */}
        {folderRenameTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-80 p-6 space-y-4 text-center">
              <h2 className="text-lg font-semibold text-blue-700">Rename Folder</h2>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="w-full p-2 border border-gray-300 rounded-lg"
                autoFocus
              />
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => { setFolderRenameTarget(null); setNewFolderName(""); }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => renameFolder(folderRenameTarget, newFolderName)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmDeleteAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-80 p-6 space-y-4 text-center">
            <h2 className="text-lg font-semibold text-red-600">Delete Account</h2>
            <p className="text-gray-700">
              Are you sure you want to permanently delete your account?
              <br />
              This cannot be undone.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setShowConfirmDeleteAccount(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Import Preview Modal ───────────────────────────────────────────────── */}
      {showImportPreview && importedPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-green-700">Import Preview</h2>

            <input
              type="text"
              value={importedPreview.folderName || ""}
              onChange={(e) =>
                setImportedPreview((prev) => ({ ...prev, folderName: e.target.value }))
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Folder name (optional)"
            />

            {importedPreview.tracks.length > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>{importedPreview.tracks.length} tracks found</span>
                <button
                  onClick={() => {
                    const allIndexes = importedPreview.tracks.map((_, i) => i);
                    const selected = importedPreview.selectedTrackIndexes?.length === allIndexes.length
                      ? []
                      : allIndexes;
                    setImportedPreview((prev) => ({ ...prev, selectedTrackIndexes: selected }));
                  }}
                  className="text-blue-600 hover:underline"
                >
                  {importedPreview.selectedTrackIndexes?.length === importedPreview.tracks.length
                    ? "Clear All"
                    : "Select All"}
                </button>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto border rounded p-3 bg-gray-50 text-sm space-y-2">
              {importedPreview.tracks.map((track, i) => (
                <label key={i} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importedPreview.selectedTrackIndexes?.includes(i)}
                    onChange={(e) => {
                      const selected = new Set(importedPreview.selectedTrackIndexes || []);
                      if (e.target.checked) selected.add(i);
                      else selected.delete(i);
                      setImportedPreview((prev) => ({
                        ...prev,
                        selectedTrackIndexes: [...selected]
                      }));
                    }}
                  />
                  <span>{track.properties?.name || `Unnamed Track ${i + 1}`}</span>
                </label>
              ))}
              {importedPreview.waypoints.length > 0 && (
                <p className="mt-2 text-xs text-gray-600">
                  ({importedPreview.waypoints.length} waypoints also included)
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowImportPreview(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const folderName = importedPreview.folderName?.trim() || importedPreview.folderName;
                  const folderId = importedPreview.folderId;
                  const selectedIndexes = new Set(importedPreview.selectedTrackIndexes || []);
                  const selectedTracksArr = importedPreview.tracks
                    .map((t, i) => ({
                      ...t,
                      properties: {
                        ...t.properties,
                        folderName,
                        folderId
                      }
                    }))
                    .filter((_, i) => selectedIndexes.has(i));
                  if (folderName && !folderOrder.includes(folderName)) {
                    setFolderOrder(prev => [...prev, folderName]);
                  }
                  const newTracks = [...userTracks, ...selectedTracksArr];
                  setUserTracks(newTracks);
                  setShowImportPreview(false);
                  setImportedPreview(null);
                  setToastMessage("✅ Import successful.");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                disabled={!importedPreview.selectedTrackIndexes?.length}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  importedPreview.selectedTrackIndexes?.length
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom Navigation ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center border-t border-gray-300 bg-white h-14">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center text-xs ${
            activeTab === "map" ? "text-green-700 font-semibold" : "text-gray-600"
          }`}
        >
          <FaMapMarkedAlt className="text-lg" />
          <span>Map</span>
        </button>
        <button
          onClick={() => setActiveTab("trip")}
          className={`flex flex-col items-center text-xs ${
            activeTab === "trip" ? "text-green-700 font-semibold" : "text-gray-600"
          }`}
        >
          <FaRoute className="text-lg" />
          <span>Trip</span>
        </button>
        <button
          onClick={() => setActiveTab("tracks")}
          className={`flex flex-col items-center text-xs ${
            activeTab === "tracks" ? "text-green-700 font-semibold" : "text-gray-600"
          }`}
        >
          <FaMap className="text-lg" />
          <span>My Tracks</span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center text-xs ${
            activeTab === "settings" ? "text-green-700 font-semibold" : "text-gray-600"
          }`}
        >
          <FaCog className="text-lg" />
          <span>Settings</span>
        </button>
      </div>

      {/* ─── Toast Message ─────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// --- CollapsibleFolder Component (unchanged) ---
function CollapsibleFolder({
  folderName,
  items,
  selectedTracks,
  setSelectedTracks,
  editingIndex,
  setEditingIndex,
  editedName,
  setEditedName,
  updateTrackName,
  exportTrack,
  setConfirmDeleteIndex,
  setConfirmDeleteFolder,
  zoomToTrack,
  formatTime,
  setFolderRenameTarget,
  setNewFolderName,
  exportFolder
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="w-full max-w-md">
      <div className="w-full bg-gray-200 rounded-t flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={items.every(({ idx }) => selectedTracks.includes(idx))}
            onChange={(e) => {
              const allIndexes = items.map(({ idx }) => idx);
              setSelectedTracks((prev) =>
                e.target.checked
                  ? [...new Set([...prev, ...allIndexes])]
                  : prev.filter((i) => !allIndexes.includes(i))
              );
            }}
          />
          <button
            onClick={() => setOpen(!open)}
            className="text-left font-bold text-green-700"
          >
            {folderName}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {folderName !== "Ungrouped" && (
            <>
              <button
                onClick={() => {
                  setFolderRenameTarget(folderName);
                  setNewFolderName(folderName);
                }}
                className="text-blue-600 font-bold text-lg"
                title="Rename Folder"
              >
                📝
              </button>
              <button
                onClick={() => exportFolder(folderName)}
                className="text-green-700 font-bold text-lg"
                title="Export Folder"
              >
                <FaDownload />
              </button>
              <button
                onClick={() => setConfirmDeleteFolder(folderName)}
                className="text-red-600 font-bold text-lg"
                title="Delete Folder"
              >
                🗑
              </button>
            </>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="text-green-700 text-xl px-1"
            aria-label="Toggle Folder"
          >
            {open ? "−" : "+"}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-2 p-2 bg-gray-50 rounded-b">
          {items.map(({ track, idx }) => (
            <div key={idx} className="bg-white p-3 rounded-lg flex items-start justify-between gap-2">
              <input
                type="checkbox"
                className="mt-2"
                checked={selectedTracks.includes(idx)}
                onChange={(e) => {
                  setSelectedTracks((prev) =>
                    e.target.checked ? [...prev, idx] : prev.filter((i) => i !== idx)
                  );
                }}
              />

              {editingIndex === idx ? (
                <>
                  <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 mr-3 p-2 border border-gray-300 rounded"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateTrackName(idx, editedName)} className="text-green-600 font-semibold">
                      Save
                    </button>
                    <button onClick={() => setEditingIndex(null)} className="text-gray-600">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <h4
                      className="font-bold text-green-700 cursor-pointer hover:underline flex items-center"
                      onClick={() => zoomToTrack(track)}
                    >
                      <span
                        className="inline-block w-3 h-3 mr-2 rounded-full"
                        style={{ backgroundColor: track.properties.stroke || "#FF0000" }}
                      />
                      {track.properties.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {track.properties.distance ? `${track.properties.distance} mi` : ""}{" "}
                      {track.properties.duration ? `• ${formatTime(track.properties.duration)}` : ""}{" "}
                      {track.properties.speed ? `• ${track.properties.speed} mph` : ""}{" "}
                      {track.properties.elevation ? `• ${track.properties.elevation} ft` : ""}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(track.properties.createdAt || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pl-4">
                    <button
                      onClick={() => {
                        setEditingIndex(idx);
                        setEditedName(track.properties.name);
                      }}
                      className="text-blue-600 font-bold text-lg"
                      title="Rename Track"
                    >
                      📝
                    </button>
                    <button
                      onClick={() => exportTrack(track)}
                      className="text-green-700"
                      title="Export Track"
                    >
                      <FaDownload className="text-xl" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteIndex(idx)}
                      className="text-red-600 font-bold text-lg"
                      title="Delete Track"
                    >
                      🗑
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
