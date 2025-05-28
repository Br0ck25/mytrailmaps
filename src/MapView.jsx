import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import booleanEqual from "@turf/boolean-equal";
import lineOverlap from "@turf/line-overlap";
import { lineString } from "@turf/helpers";

function isDuplicateLine(lineFeature, mainLines, threshold = 0.8) {
  const publicLine = lineString(lineFeature.geometry.coordinates);

  return mainLines.some(main => {
    const mainLine = lineString(main.geometry.coordinates);

    // Overlap returns the overlapping geometry
    const overlap = lineOverlap(publicLine, mainLine, { tolerance: 0.0001 });

    const overlapLength = overlap.features.reduce((sum, feat) => sum + feat.geometry.coordinates.length, 0);
    const publicLength = lineFeature.geometry.coordinates.length;

    return overlapLength / publicLength >= threshold;
  });
}


export default function MapView({
  showTracks,
  showNames,
  showWaypoints,
  showWaypointLabels,
  onGeolocateControlReady
}) {
  const mapRef = useRef(null);
  const currentMap = useRef(null);
  const lastHighlighted = useRef(null);

  const [mainGeojsonFiles, setMainGeojsonFiles] = useState([]);
  const [publicGeojsonFiles, setPublicGeojsonFiles] = useState([]);

  useEffect(() => {
    fetch("/tracks/manifest.json")
      .then((res) => res.json())
      .then(setMainGeojsonFiles)
      .catch((err) => console.error("❌ Failed to load main track manifest:", err));
  }, []);

  useEffect(() => {
    fetch("/public-tracks/manifest.json")
      .then((res) => res.json())
      .then(setPublicGeojsonFiles)
      .catch((err) => console.error("❌ Failed to load public track manifest:", err));
  }, []);

  useEffect(() => {
    const map = currentMap.current;
    if (!map || !map.getStyle()) return;

    map.getStyle().layers?.forEach((layer) => {
      const id = layer.id;
      if (id.endsWith("-line")) map.setPaintProperty(id, "line-opacity", showTracks ? 1 : 0);
      if (id.endsWith("-label")) map.setLayoutProperty(id, "visibility", showNames ? "visible" : "none");
      if (id.endsWith("-waypoints")) map.setLayoutProperty(id, "visibility", showWaypoints ? "visible" : "none");
      if (id.endsWith("-waypoint-labels")) map.setLayoutProperty(id, "visibility", showWaypointLabels ? "visible" : "none");
    });
  }, [showTracks, showNames, showWaypoints, showWaypointLabels]);

  useEffect(() => {
    const savedCenter = localStorage.getItem("mapCenter");
    const savedZoom = localStorage.getItem("mapZoom");

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: savedCenter ? JSON.parse(savedCenter) : [-84.3, 36.5],
      zoom: savedZoom ? parseFloat(savedZoom) : 9,
    });

    currentMap.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: false,
    });
    map.addControl(geolocate);

    map.on("load", () => {
      const mainWaypointNames = new Set();
    const mainTrackLines = [];

      map.once("idle", () => {
        if (typeof onGeolocateControlReady === "function") {
          onGeolocateControlReady(() => {
            if (geolocate?.trigger) geolocate.trigger();
          });
        }
      });

      const addTrackLayers = (filename, sourcePrefix, isPublic = false) => {
  const slug = filename.replace(/\.(geojson|topojson)$/i, "").toLowerCase();
  const sourceId = `${sourcePrefix}-${slug}`;
  const lineId = `${sourceId}-line`;
  const labelId = `${sourceId}-label`;
  const waypointId = `${sourceId}-waypoints`;
  const waypointLabelId = `${sourceId}-waypoint-labels`;
  const fileLabelId = `${sourceId}-file-label`;

  const url = isPublic ? `/public-tracks/${filename}` : `/tracks/${filename}`;
  fetch(url)
    .then(res => res.json())
    .then(rawData => {
      let data;
      if (filename.endsWith(".topojson")) {
        const objName = Object.keys(rawData.objects)[0];
        data = feature(rawData, rawData.objects[objName]);
      } else {
        data = rawData;
      }

      // Assign IDs and track waypoint names
      data.features = data.features.map((f, i) => {
        f.id = i;
        return f;
      });

      if (!isPublic) {
        data.features.forEach(f => {
          if (f.geometry?.type === "Point" && f.properties?.name) {
            mainWaypointNames.add(f.properties.name.trim());
          }
        });
      }

      if (isPublic) {
        data.features = data.features.filter(f => {
          if (f.geometry?.type !== "Point") return true;
          const name = f.properties?.name?.trim();
          return !name || !mainWaypointNames.has(name);
        });
      }

      map.addSource(sourceId, { type: "geojson", data });

      map.addLayer({
        id: lineId,
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
        layout: { "line-cap": "round", "line-join": "round" }
      });

      map.addLayer({
        id: labelId,
        type: "symbol",
        source: sourceId,
        filter: ["==", "$type", "LineString"],
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 14],
          visibility: showNames ? "visible" : "none"
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 2
        },
        minzoom: 10
      });

      map.addLayer({
        id: waypointId,
        type: "circle",
        source: sourceId,
        filter: ["==", "$type", "Point"],
        layout: { visibility: showWaypoints ? "visible" : "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 14, 6],
          "circle-color": "#ff6600",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff"
        },
        minzoom: 9
      });

      map.addLayer({
        id: waypointLabelId,
        type: "symbol",
        source: sourceId,
        filter: ["==", "$type", "Point"],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 14],
          "text-offset": [0, 1.2],
          visibility: showWaypointLabels ? "visible" : "none"
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 1.5
        },
        minzoom: 12
      });

      map.addLayer({
        id: fileLabelId,
        type: "symbol",
        source: sourceId,
        filter: ["==", ["get", "type"], "file-label"],
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 14, 16],
          "text-anchor": "center"
        },
        paint: {
          "text-color": "#000",
          "text-halo-color": "#fff",
          "text-halo-width": 2
        },
        minzoom: 9
      });

      map.on("mouseenter", lineId, () => map.getCanvas().style.cursor = "pointer");
      map.on("mouseleave", lineId, () => map.getCanvas().style.cursor = "");
    });
};


      mainGeojsonFiles.forEach(f => addTrackLayers(f, "track"));
      publicGeojsonFiles.forEach(f => addTrackLayers(f, "public", true));

      map.on("click", (e) => {
        const layersToCheck = map.getStyle().layers.filter((l) =>
          l.id.endsWith("-line")
        ).map((l) => l.id);

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
                <p>${props.description || "No description available."}</p>
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

    if (!mapRef.current) return;

    return () => map.remove();return () => {
  if (currentMap.current) {
    try {
      currentMap.current.remove();
    } catch (e) {
      console.warn("Map removal failed:", e.message);
    }
  }
}
}, [mainGeojsonFiles, publicGeojsonFiles]);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
