// src/MapView.jsx
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
  mapRef // passed in from Dashboard
}) {
  const currentMap = useRef(null);
  const lastHighlighted = useRef(null);

  const [mainGeojsonFiles, setMainGeojsonFiles] = useState([]);
  const [publicGeojsonFiles, setPublicGeojsonFiles] = useState([]);

  //
  // 1) Load the two manifests exactly once:
  //
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch("/tracks/manifest.json", { signal })
      .then(res => res.json())
      .then(setMainGeojsonFiles)
      .catch(err => {
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
      .then(res => res.json())
      .then(setPublicGeojsonFiles)
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("❌ Failed to load public track manifest:", err);
        }
      });

    return () => controller.abort();
  }, []);

  //
  // 2) Instantiate the map ONCE (no dependencies):
  //
  useEffect(() => {
    if (!mapRef.current) return;

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

    map.on("load", () => {
      // Expose mapRef to parent
      if (mapRef && typeof mapRef === "object") {
        mapRef.current = map;
      }

      // Trigger geolocate once style is fully loaded
      map.once("idle", () => {
        if (typeof onGeolocateControlReady === "function") {
          onGeolocateControlReady(() => {
            if (geolocate?.trigger) geolocate.trigger();
          });
        }
      });

      // Click‐to‐popup logic (unchanged)
      map.on("click", (e) => {
        const layersToCheck = map
          .getStyle()
          .layers.filter(l => l.id.endsWith("-line"))
          .map(l => l.id);

        const features = map.queryRenderedFeatures(e.point, { layers: layersToCheck });
        if (features.length > 0) {
          const featureClicked = features[0];
          const source = featureClicked.layer.source;
          const id = featureClicked.id;

          if (lastHighlighted.current) {
            map.setFeatureState(lastHighlighted.current, { highlighted: false });
          }
          if (id !== undefined) {
            lastHighlighted.current = { source, id };
            map.setFeatureState({ source, id }, { highlighted: true });
          }

          const props = featureClicked.properties;
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

      // Save view on moveend (unchanged)
      map.on("moveend", () => {
        const center = map.getCenter();
        localStorage.setItem("mapCenter", JSON.stringify([center.lng, center.lat]));
        localStorage.setItem("mapZoom", map.getZoom());
      });
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
  }, []); // ← run exactly once

  //
  // 3) Whenever either manifest array changes, add all layers (honoring toggles at creation time):
  //
  useEffect(() => {
    const map = currentMap.current;
    if (!map || !map.isStyleLoaded()) return;

    // First, gather “main” waypoints/names to filter duplicates in public tracks
    const mainWaypointNames = new Set();
    const mainTrackLines = [];

    // Helper: add one GeoJSON source & its layers, with initial visibility from toggles
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

      // Build main sets for de‐duplication
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
            const nm = f.properties?.name?.trim();
            return !mainWaypointNames.has(nm);
          }
          return true;
        });
      }

      // Add GeoJSON source
      map.addSource(sourceId, { type: "geojson", data });

      // 3a) Line layer:
      map.addLayer({
        id: `${sourceId}-line`,
        type: "line",
        source: sourceId,
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": ["coalesce", ["get", "stroke"], isPublic ? "#FF0000" : "#0074D9"],
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "highlighted"], false],
            1,
            isPublic ? 0.2 : 1
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 2, 15, 3]
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: isPublic
            ? (showPublicTracks ? "visible" : "none")
            : (showTracks ? "visible" : "none")
        }
      });

      // 3b) Line‐label (track names) along each line
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
          visibility: isPublic
            ? (showPublicTracks && showNames ? "visible" : "none")
            : (showNames ? "visible" : "none")
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 2
        },
        minzoom: 10
      });

      // 3c) Waypoint circles:
      map.addLayer({
        id: `${sourceId}-waypoints`,
        type: "circle",
        source: sourceId,
        filter: ["==", "$type", "Point"],
        layout: {
          visibility: isPublic
            ? (showPublicTracks && showWaypoints ? "visible" : "none")
            : (showWaypoints ? "visible" : "none")
        },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 14, 6],
          "circle-color": "#ff6600",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff"
        },
        minzoom: 9
      });

      // 3d) Waypoint name labels:
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
          visibility: isPublic
            ? (showPublicTracks && showWaypointLabels ? "visible" : "none")
            : (showWaypointLabels ? "visible" : "none")
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 1.5
        },
        minzoom: 12
      });

      // 3e) File‐level label (centered “park name”)
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
          "symbol-placement": "point",
          visibility: "visible"
        },
        paint: {
          "text-color": "#000",
          "text-halo-color": "#fff",
          "text-halo-width": 2
        },
        minzoom: 6
      });

      // Keep file‐label on top
      map.moveLayer(`${sourceId}-file-label`);
    };

    // Add each “main” track file
    Promise.all(
      mainGeojsonFiles.map(f => addTrackLayers(f, "track", false))
    )
      .then(() => {
        // Once all main tracks are added, add all public tracks
        publicGeojsonFiles.forEach(f => addTrackLayers(f, "public", true));
      })
      .catch(err => console.error("❌ Error adding track layers:", err));
  }, [mainGeojsonFiles, publicGeojsonFiles, showTracks, showNames, showWaypoints, showWaypointLabels, showPublicTracks]);

  //
  // 4) “MyTracks” (userTracks prop) — re‐draw whenever userTracks changes
  //
  useEffect(() => {
    const map = currentMap.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = "user-tracks";
    const layerId = "user-tracks-line";

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (userTracks && userTracks.length > 0) {
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
          "line-color": "#00cc00",
          "line-width": 3,
          "line-opacity": 0.8
        },
        layout: {
          visibility: showTracks ? "visible" : "none"
        }
      });
    }
  }, [userTracks, showTracks]);

  //
  // 5) “liveTrack” line (re‐draw whenever liveTrack changes)
  //
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
        },
        layout: {
          visibility: showTracks ? "visible" : "none"
        }
      });
    }
  }, [liveTrack, showTracks]);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
