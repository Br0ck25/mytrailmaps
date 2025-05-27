import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// List your converted GeoJSON files here
const geojsonFiles = [
  "BlackMountainOffRoadAdventureArea.geojson",
  "Brimstone2023.geojson",
  "WindrockPark.geojson",
  // Add more here
];

export default function MapView({
  showTracks,
  showNames,
  showWaypoints,
  showWaypointLabels,
  onGeolocateControlReady,
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    const savedCenter = localStorage.getItem("mapCenter");
    const savedZoom = localStorage.getItem("mapZoom");

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: savedCenter ? JSON.parse(savedCenter) : [-84.3, 36.5],
      zoom: savedZoom ? parseFloat(savedZoom) : 9,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: false,
    });

    map.addControl(geolocate);

    map.on("load", () => {
      if (onGeolocateControlReady) {
        setTimeout(() => {
          onGeolocateControlReady(() => geolocate.trigger());
        }, 0);
      }

      geojsonFiles.forEach((filename) => {
        const slug = filename.replace(".geojson", "").toLowerCase();
        const sourceId = `track-${slug}`;
        const lineId = `${sourceId}-line`;
        const labelId = `${sourceId}-label`;
        const waypointId = `${sourceId}-waypoints`;
        const waypointLabelId = `${sourceId}-waypoint-labels`;

        fetch(`/tracks/${filename}`)
          .then((res) => {
            if (!res.ok) throw new Error(`❌ Failed to load ${filename}`);
            return res.json();
          })
          .then((data) => {
            map.addSource(sourceId, { type: "geojson", data });

            // Line track
            map.addLayer({
              id: lineId,
              type: "line",
              source: sourceId,
              filter: ["==", "$type", "LineString"],
              paint: {
                "line-color": ["coalesce", ["get", "stroke"], "#00f"],
                "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 2, 15, 3],
                "line-opacity": showTracks ? 1 : 0,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            });

            // Label track (if name exists)
            const nameFeature = data.features.find(
              (f) => f.geometry?.type === "LineString" && f.properties?.name
            );

            if (nameFeature) {
              map.addLayer({
                id: labelId,
                type: "symbol",
                source: sourceId,
                filter: ["==", "$type", "LineString"],
                layout: {
                  "symbol-placement": "line",
                  "text-field": nameFeature.properties.name,
                  "text-font": ["Open Sans Bold"],
                  "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 14],
                  visibility: showNames ? "visible" : "none",
                },
                paint: {
                  "text-color": "#333",
                  "text-halo-color": "#fff",
                  "text-halo-width": 2,
                },
                minzoom: 10,
              });
            }

            // Waypoints (points)
            map.addLayer({
              id: waypointId,
              type: "circle",
              source: sourceId,
              filter: ["==", "$type", "Point"],
              layout: {
                visibility: showWaypoints ? "visible" : "none",
              },
              paint: {
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 14, 6],
                "circle-color": "#ff6600",
                "circle-stroke-width": 1,
                "circle-stroke-color": "#fff",
              },
              minzoom: 9,
            });

            // Waypoint Labels
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
                visibility: showWaypointLabels ? "visible" : "none",
              },
              paint: {
                "text-color": "#333",
                "text-halo-color": "#fff",
                "text-halo-width": 1.5,
              },
              minzoom: 12,
            });
          })
          .catch((err) => console.error(err));
      });
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      localStorage.setItem("mapCenter", JSON.stringify([center.lng, center.lat]));
      localStorage.setItem("mapZoom", map.getZoom());
    });

    return () => map.remove();
  }, [showTracks, showNames, showWaypoints, showWaypointLabels]);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
