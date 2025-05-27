import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView({
  showTracks,
  showNames,
  showWaypoints,
  showWaypointLabels,
  onGeolocateControlReady,
  tileJson // ✅ new prop
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
      map.showTileBoundaries = true;
      map.showCollisionBoxes = true;

      if (onGeolocateControlReady) {
        setTimeout(() => {
          onGeolocateControlReady(() => geolocate.trigger());
        }, 0);
      }

      map.on("sourcedata", (e) => {
        if (e.sourceId === "tracks" && e.tile && e.tile.rawData) {
          console.log("🧩 Tile rawData:", e.tile.rawData);
        } else {
          console.log("📡 Source loaded event:", e);
        }
      });

      map.addSource("tracks", {
  type: "vector",
  tiles: tileJson.tiles,
  minzoom: tileJson.minzoom,
  maxzoom: tileJson.maxzoom
});

      map.addLayer({
        id: "trackdata-line",
        type: "line",
        source: "tracks",
        "source-layer": "trackdata",
        paint: {
          "line-color": "#ff0000",
          "line-width": 4,
          "line-opacity": 1,
        },
        layout: {
          visibility: "visible",
        },
      });

      map.addLayer({
        id: "trackdata-label",
        type: "symbol",
        source: "tracks",
        "source-layer": "trackdata",
        layout: {
          "text-field": ["get", "name"],
          "symbol-placement": "line",
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

      map.addLayer({
        id: "trackdata-debug-points",
        type: "circle",
        source: "tracks",
        "source-layer": "trackdata",
        paint: {
          "circle-radius": 6,
          "circle-color": "#00f",
        },
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
