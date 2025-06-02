import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import length from "@turf/length";
import { lineString } from "@turf/helpers";
import lineOverlap from "@turf/line-overlap";
import localforage from "localforage";


function isDuplicateLine(lineFeature, mainLines, threshold = 0.0001) {
  const coords = lineFeature.geometry?.coordinates;
  if (
    !Array.isArray(coords) ||
    coords.length < 2 ||
    coords.some(c => !Array.isArray(c) || c.length !== 2 || isNaN(c[0]) || isNaN(c[1]))
  ) {
    return false;
  }

  const publicLine = lineString(coords);
  const publicLength = length(publicLine);
  if (!publicLength || isNaN(publicLength)) return false;

  return mainLines.some(main => {
    const mainCoords = main.geometry?.coordinates;
    if (
      !Array.isArray(mainCoords) ||
      mainCoords.length < 2 ||
      mainCoords.some(c => !Array.isArray(c) || c.length !== 2 || isNaN(c[0]) || isNaN(c[1]))
    ) {
      return false;
    }

    const mainLine = lineString(mainCoords);
    const overlap = lineOverlap(publicLine, mainLine, { tolerance: 0.002 });
    const overlapLength = overlap.features.reduce((sum, feat) => sum + length(feat), 0);

    return overlapLength / publicLength >= threshold;
  });
}

export default function MapView({
  showTracks,
  showNames,
  showWaypoints,
  showWaypointLabels,
  showPublicTracks,
  liveTrack,
  userTracks,
  onGeolocateControlReady,
  mapRef,
  isPaid,
}) {
  const currentMap = useRef(null);         // ✅ keep
  const lastHighlighted = useRef(null);    // ✅ keep

  const [mainGeojsonFiles, setMainGeojsonFiles] = useState([]);
  const [publicGeojsonFiles, setPublicGeojsonFiles] = useState([]);


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch("/tracks/manifest.json", { signal })
      .then((res) => res.json())
      .then(setMainGeojsonFiles)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("❌ Failed to load main track manifest:", err);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch("/public-tracks/manifest.json", { signal })
      .then((res) => res.json())
      .then(setPublicGeojsonFiles)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("❌ Failed to load public track manifest:", err);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
  if (!mapRef.current) return; // ✅ wait until <div ref={mapRef}> is mounted

  const map = new maplibregl.Map({
    container: mapRef.current,
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    center: JSON.parse(localStorage.getItem("mapCenter") || "[-84.3, 36.5]"),
    zoom: parseFloat(localStorage.getItem("mapZoom") || "9")
  });

  currentMap.current = map;
  map.addControl(new maplibregl.NavigationControl(), "top-right");

  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
    showAccuracyCircle: false
  });
  map.addControl(geolocate);
    const mainWaypointNames = new Set();
  const mainTrackLines = [];


const addTrackLayers = async (filename, sourcePrefix, isPublic = false) => {
  const slug = filename.replace(/\.(geojson|topojson)$/i, "").toLowerCase();
  const sourceId = `${sourcePrefix}-${slug}`;
  const url = isPublic ? `/public-tracks/${filename}` : `/tracks/${filename}`;
  const cacheKey = `${isPublic ? "public" : "main"}-track:${filename}`;

  let rawData;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rawData = await res.json();
    await localforage.setItem(cacheKey, rawData);
  } catch (err) {
    console.warn(`⚠️ Fetch failed for ${filename}, loading from cache...`, err);
    rawData = await localforage.getItem(cacheKey);
    if (!rawData) {
      console.error(`❌ No cached copy for ${filename}`);
      return;
    }
  }

  let data = filename.endsWith(".topojson")
    ? feature(rawData, rawData.objects[Object.keys(rawData.objects)[0]])
    : rawData;

  data.features = data.features.map((f, i) => {
    if (!f.properties) f.properties = {};
    return { ...f, id: i, properties: { ...f.properties } };
  });



  if (!isPublic) {
    data.features.forEach(f => {
      if (f.geometry?.type === "Point" && f.properties?.name) {
        mainWaypointNames.add(f.properties.name.trim());
      } else if (f.geometry?.type === "LineString") {
        mainTrackLines.push(f);
      }
    });
  } else {
    data.features = data.features.filter(f => {
      if (f.geometry?.type === "LineString") {
        return !isDuplicateLine(f, mainTrackLines);
      }
      if (f.geometry?.type === "Point") {
        const name = f.properties?.name?.trim();
        return !mainWaypointNames.has(name);
      }
      return true;
    });
  }

  map.addSource(sourceId, { type: "geojson", data });

  // Track name labels
map.addLayer({
  id: `${sourceId}-label`,
  type: "symbol",
  source: sourceId,
  filter: ["==", "$type", "LineString"],
  layout: {
    "symbol-placement": "line",
    "text-field": ["get", "name"],
    "text-font": ["Open Sans Bold"],
    "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 14],
    visibility: isPublic && !showPublicTracks ? "none" : (showNames ? "visible" : "none")
  },
  paint: {
    "text-color": "#333",
    "text-halo-color": "#fff",
    "text-halo-width": 2
  },
  minzoom: 10
});

// Waypoint circles
map.addLayer({
  id: `${sourceId}-waypoints`,
  type: "circle",
  source: sourceId,
  filter: ["==", "$type", "Point"],
  layout: {
    visibility: isPublic && !showPublicTracks ? "none" : (showWaypoints ? "visible" : "none")
  },
  paint: {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 14, 6],
    "circle-color": "#ff6600",
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff"
  },
  minzoom: 9
});

// Waypoint name labels
map.addLayer({
  id: `${sourceId}-waypoint-labels`,
  type: "symbol",
  source: sourceId,
  filter: ["==", "$type", "Point"],
  layout: {
    "text-field": ["get", "name"],
    "text-font": ["Open Sans Regular"],
    "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 14],
    "text-offset": [0, 1.2],
    visibility: isPublic && !showPublicTracks ? "none" : (showWaypointLabels ? "visible" : "none")
  },
  paint: {
    "text-color": "#333",
    "text-halo-color": "#fff",
    "text-halo-width": 1.5
  },
  minzoom: 12
});

// File-level centered park label (type = "file-label")
map.addLayer({
  id: `${sourceId}-file-label`,
  type: "symbol",
  source: sourceId,
  filter: ["==", ["get", "type"], "file-label"],
  layout: {
    "text-field": ["get", "label"],
    "text-font": ["Open Sans Bold"],
    "text-size": ["interpolate", ["linear"], ["zoom"], 6, 8, 14, 14],
    "text-anchor": "center",
    "text-allow-overlap": true,
    "text-ignore-placement": true,
    "symbol-placement": "point"
  },
  paint: {
    "text-color": "#000",
    "text-halo-color": "#fff",
    "text-halo-width": 2
  },
  minzoom: 6
});


  map.addLayer({
  id: `${sourceId}-line`,
  type: "line",
  source: sourceId,
  filter: ["==", "$type", "LineString"],
  paint: {
    "line-color": ["coalesce", ["get", "stroke"], "#666"],
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "highlighted"], false],
      1, isPublic ? 0.2 : 1
    ],
    "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 2, 15, 3]
  },
  layout: {
    "line-cap": "round",
    "line-join": "round",
    // ↓ Main tracks respect `showTracks`; public tracks respect `showPublicTracks`
    visibility: isPublic
      ? (showPublicTracks ? "visible" : "none")
      : (showTracks ? "visible" : "none")
  }
});

  // Ensure file-labels are on top
map.moveLayer(`${sourceId}-file-label`);
};





    map.on("load", async () => {

  // ✅ Set the mapRef first
  if (mapRef && typeof mapRef === "object") {
    mapRef.current = map;
  }

  // ✅ Load tracks with fallback to cache
  await Promise.all([
    ...mainGeojsonFiles.map(f => addTrackLayers(f, "track", false)),
    ...publicGeojsonFiles.map(f => addTrackLayers(f, "public", true))
  ]);

// ✅ Trigger geolocate once map is idle
map.once("idle", () => {
  if (typeof onGeolocateControlReady === "function") {
    onGeolocateControlReady(() => {
      if (geolocate?.trigger) geolocate.trigger();
    });
  }

  // ✅ Apply toggle visibility after layers are added
  try {
    map.getStyle().layers?.forEach(layer => {
      const id = layer.id;

      if (id.startsWith("public-") && id.endsWith("-line")) {
        map.setLayoutProperty(id, "visibility", showPublicTracks ? "visible" : "none");
      }
      if (id.startsWith("public-") && id.endsWith("-label")) {
        map.setLayoutProperty(id, "visibility", showPublicTracks && showNames ? "visible" : "none");
      }
      if (id.startsWith("public-") && id.endsWith("-waypoints")) {
        map.setLayoutProperty(id, "visibility", showPublicTracks && showWaypoints ? "visible" : "none");
      }
      if (id.startsWith("public-") && id.endsWith("-waypoint-labels")) {
        map.setLayoutProperty(id, "visibility", showPublicTracks && showWaypointLabels ? "visible" : "none");
      }

      if (!id.startsWith("public-") && id.endsWith("-line")) {
        map.setLayoutProperty(id, "visibility", showTracks ? "visible" : "none");
      }
      if (!id.startsWith("public-") && id.endsWith("-label")) {
        map.setLayoutProperty(id, "visibility", showNames ? "visible" : "none");
      }
      if (!id.startsWith("public-") && id.endsWith("-waypoints")) {
        map.setLayoutProperty(id, "visibility", showWaypoints ? "visible" : "none");
      }
      if (!id.startsWith("public-") && id.endsWith("-waypoint-labels")) {
        map.setLayoutProperty(id, "visibility", showWaypointLabels ? "visible" : "none");
      }
    });
  } catch (err) {
    console.warn("⚠️ Failed to apply initial layer visibility:", err.message);
  }
});


  // ✅ Map click interaction logic (keep this part as-is)
  map.on("click", (e) => {
    const layersToCheck = map.getStyle().layers.filter(l => l.id.endsWith("-line")).map(l => l.id);
    const features = map.queryRenderedFeatures(e.point, { layers: layersToCheck });

    if (features.length > 0) {
      const feature = features[0];
      const source = feature.layer.source;
      const id = feature.id;

      if (lastHighlighted.current) {
        map.setFeatureState(lastHighlighted.current, { highlighted: false });
      }

      if (id !== undefined) {
        lastHighlighted.current = { source, id };
        map.setFeatureState({ source, id }, { highlighted: true });
      }

      const props = feature.properties;
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="track-popup">
            <h3>${props.name || "Unnamed Track"}</h3>
            <p>${props.desc || props.description || "No description available."}</p>
          </div>
        `)
        .addTo(map);
    }
  });
});


    map.on("moveend", () => {
      const center = map.getCenter();
      localStorage.setItem("mapCenter", JSON.stringify([center.lng, center.lat]));
      localStorage.setItem("mapZoom", map.getZoom());
    });

    return () => {
      if (currentMap.current) {
        try {
          currentMap.current.remove();
        } catch (e) {
          console.warn("Map removal failed:", e.message);
        }
      }
    };
  }, [mainGeojsonFiles, publicGeojsonFiles]);

 useEffect(() => {
  const map = currentMap.current;
  if (!map || !map.isStyleLoaded()) return;
  if (!isPaid) return; // ✅ Move this AFTER confirming map is ready

  try {
    map.getStyle().layers?.forEach((layer) => {
      const id = layer.id;

      if (id.startsWith("public-") && id.endsWith("-line")) {
        map.setLayoutProperty(id, "visibility", showPublicTracks ? "visible" : "none");
      }
      if (id.startsWith("public-") && id.endsWith("-label")) {
        map.setLayoutProperty(id, "visibility", showPublicTracks && showNames ? "visible" : "none");
      }
      if (id.startsWith("public-") && id.endsWith("-waypoints")) {
        map.setLayoutProperty(id, "visibility", showPublicTracks && showWaypoints ? "visible" : "none");
      }
      if (id.startsWith("public-") && id.endsWith("-waypoint-labels")) {
        map.setLayoutProperty(id, "visibility", showPublicTracks && showWaypointLabels ? "visible" : "none");
      }

      if (!id.startsWith("public-") && id.endsWith("-line")) {
        map.setLayoutProperty(id, "visibility", showTracks ? "visible" : "none");
      }
      if (!id.startsWith("public-") && id.endsWith("-label")) {
        map.setLayoutProperty(id, "visibility", showNames ? "visible" : "none");
      }
      if (!id.startsWith("public-") && id.endsWith("-waypoints")) {
        map.setLayoutProperty(id, "visibility", showWaypoints ? "visible" : "none");
      }
      if (!id.startsWith("public-") && id.endsWith("-waypoint-labels")) {
        map.setLayoutProperty(id, "visibility", showWaypointLabels ? "visible" : "none");
      }
    });
  } catch (err) {
    console.warn("⚠️ Failed to update layer visibility:", err.message);
  }
}, [showTracks, showNames, showWaypoints, showWaypointLabels, showPublicTracks, isPaid]);


useEffect(() => {
  const map = currentMap.current;
  if (!map || !map.isStyleLoaded()) return;

  const sourceId = "user-tracks";
  const layerId = "user-tracks-line";

  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  if (showUserTracks && userTracks && userTracks.length > 0) {
    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: userTracks
      }
    });

    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#FF0000",
        "line-width": 4,
        "line-opacity": 0.9
      }
    });
  }
}, [userTracks]); // ✅ this ends the first effect

useEffect(() => {
  const map = currentMap.current;
  if (!map || !map.isStyleLoaded()) return;

  const sourceId = "live-track";
  const layerId = "live-track-line";

  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  if (liveTrack && liveTrack.length > 1) {
    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: liveTrack
        }
      }
    });

    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#0074D9",
        "line-width": 4,
        "line-opacity": 0.8
      }
    });
  }
}, [liveTrack]);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
