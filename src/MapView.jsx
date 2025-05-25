import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView({ showTracks, showNames, showWaypoints, showWaypointLabels, onGeolocateControlReady }) {
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

      map.addSource("tracks", {
  type: "vector",
  tiles: [
    "https://mytrailmaps.brocksville.com/tiles/trackdata/{z}/{x}/{y}.pbf"
  ],
  minzoom: 10,
  maxzoom: 16
});


      map.addLayer({
        id: "trackdata-line",
        type: "line",
        source: "tracks",
        "source-layer": "trackdata",
        paint: {
          "line-color": "#3388ff",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 14, 3],
          "line-opacity": showTracks ? 1 : 0
        },
        layout: {
          visibility: showTracks ? "visible" : "none"
        }
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
          visibility: showNames ? "visible" : "none"
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 2
        },
        minzoom: 10
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
