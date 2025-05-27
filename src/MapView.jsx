import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// List your geojson filenames (no path needed)
const geojsonFiles = [
  "BlackMountainOffRoadAdventureArea.geojson",
  "WindrockPark.geojson",
  "Brimstone2023.geojson",
  // Add more filenames here
];

export default function MapView({ showTracks, showNames, onGeolocateControlReady }) {
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

      geojsonFiles.forEach((filename, index) => {
        const slug = filename.replace(".geojson", "").toLowerCase();
        const sourceId = `track-${slug}`;
        const lineId = `${sourceId}-line`;
        const labelId = `${sourceId}-label`;

        fetch(`/tracks/${filename}`)
          .then((res) => res.json())
          .then((data) => {
            map.addSource(sourceId, { type: "geojson", data });

            map.addLayer({
              id: lineId,
              type: "line",
              source: sourceId,
              paint: {
                "line-color": "#00f",
                "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 2, 15, 3],
                "line-opacity": showTracks ? 1 : 0,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            });

            const namedFeature = data.features.find(
              (f) => f.geometry.type === "LineString" && f.properties?.name
            );

            if (namedFeature) {
              map.addLayer({
                id: labelId,
                type: "symbol",
                source: sourceId,
                layout: {
                  "symbol-placement": "line",
                  "text-field": namedFeature.properties.name,
                  "text-font": ["Open Sans Bold"],
                  "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 14],
                  visibility: showNames ? "visible" : "none",
                },
                paint: {
                  "text-color": "#333",
                  "text-halo-color": "#fff",
                  "text-halo-width": 2,
                },
              });
            }
          });
      });
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      localStorage.setItem("mapCenter", JSON.stringify([center.lng, center.lat]));
      localStorage.setItem("mapZoom", map.getZoom());
    });

    return () => map.remove();
  }, [showTracks, showNames]);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
