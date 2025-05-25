import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { gpx as toGeoJSON } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";

export default function MapView({ showTracks, showNames, showWaypoints, showWaypointLabels }) {
  const mapRef = useRef(null);
  const sourcesLoaded = useRef(new Set());
  const currentMap = useRef(null);

  const updateLayerVisibility = () => {
    const map = currentMap.current;
    if (!map || !map.getStyle()) return;

    map.getStyle().layers?.forEach(layer => {
      const id = layer.id;
      if (id.endsWith("-line")) {
        map.setLayoutProperty(id, "visibility", showTracks ? "visible" : "none");
      }
      if (id.endsWith("-label")) {
        map.setLayoutProperty(id, "visibility", showNames ? "visible" : "none");
      }
      if (id.endsWith("-waypoints-icons")) {
        map.setLayoutProperty(id, "visibility", showWaypoints ? "visible" : "none");
      }
      if (id.endsWith("-waypoints-labels")) {
        map.setLayoutProperty(id, "visibility", showWaypointLabels ? "visible" : "none");
      }
    });
  };

  const parseTrackColor = (trkEl) => {
    const fallback = "#3388ff";
    const extensions = [...trkEl.children].find(c => c.tagName.toLowerCase().endsWith("extensions"));
    if (!extensions) return fallback;

    const colorTag = [...extensions.getElementsByTagName("*")].find(c =>
      c.tagName.toLowerCase().endsWith("displaycolor") || c.tagName.toLowerCase().endsWith("color")
    );
    if (!colorTag || !colorTag.textContent.trim()) return fallback;

    const value = colorTag.textContent.trim();
    const hexColor = value.match(/^#?[0-9a-f]{6}$/i) ? `#${value.replace(/^#/, "")}` : null;
    if (hexColor) return hexColor;

    const namedColors = {
      "DarkRed": "#8B0000", "DarkGreen": "#006400", "DarkBlue": "#00008B",
      "Purple": "#800080", "DarkCyan": "#008B8B", "Magenta": "#FF00FF",
      "Gray": "#808080", "Black": "#000000", "LightGray": "#D3D3D3",
      "DarkYellow": "#B8860B", "Yellow": "#FFFF00", "Red": "#FF0000",
      "Green": "#00FF00", "Blue": "#0000FF"
    };

    return namedColors[value] || fallback;
  };

  useEffect(() => {
    updateLayerVisibility();
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

    map.on("moveend", () => {
      const center = map.getCenter();
      localStorage.setItem("mapCenter", JSON.stringify([center.lng, center.lat]));
      localStorage.setItem("mapZoom", map.getZoom());
    });

    const fetchVisibleTracks = () => {
      if (!map) return;

      const bounds = map.getBounds();
      const apiBase = import.meta.env.PROD
        ? "https://mytrailmapsworker.jamesbrock25.workers.dev/api"
        : "/api";

      const url = `${apiBase}/tracks-in-bounds?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}`;

      fetch(url)
        .then((res) => res.json())
        .then((slugs) => {
          slugs.forEach(({ slug }) => {
            if (sourcesLoaded.current.has(slug)) return;
            sourcesLoaded.current.add(slug);

            fetch(`${apiBase}/admin-gpx/${slug}`)
              .then((res) => res.text())
              .then((gpxText) => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(gpxText, "application/xml");
                const trkElements = xml.getElementsByTagName("trk");

                Array.from(trkElements).forEach((trkEl, index) => {
                  const gpxDoc = document.implementation.createDocument("", "", null);
                  const gpxRoot = gpxDoc.createElement("gpx");
                  gpxDoc.appendChild(gpxRoot);
                  gpxRoot.appendChild(trkEl.cloneNode(true));

                  const geojson = toGeoJSON(gpxDoc);
                  if (!geojson || !geojson.features.length) return;

                  const trackColor = parseTrackColor(trkEl);
                  const sourceId = `${slug}-trk-${index}`;

                  map.addSource(sourceId, {
                    type: "geojson",
                    data: geojson,
                  });

                  map.addLayer({
                    id: `${sourceId}-line`,
                    type: "line",
                    source: sourceId,
                    layout: {
                      "line-join": "round",
                      "line-cap": "round",
                      visibility: showTracks ? "visible" : "none",
                    },
                    paint: {
                      "line-color": trackColor,
                      "line-width": [
                        "interpolate", ["linear"], ["zoom"],
                        5, 1,
                        10, 2,
                        15, 3
                      ],
                    },
                  });

                  const nameFeature = geojson.features.find(f =>
                    f.properties?.name && f.geometry?.type === "LineString"
                  );

                  if (nameFeature) {
                    map.addLayer({
                      id: `${sourceId}-label`,
                      type: "symbol",
                      source: sourceId,
                      layout: {
                        "symbol-placement": "line",
                        "text-field": nameFeature.properties.name,
                        "text-font": ["Open Sans Bold"],
                        "text-size": [
                          "interpolate", ["linear"], ["zoom"],
                          8, 10,
                          14, 14
                        ],
                        visibility: showNames ? "visible" : "none",
                      },
                      paint: {
                        "text-color": "#333",
                        "text-halo-color": "#fff",
                        "text-halo-width": 2,
                      },
                      filter: ["==", "$type", "LineString"],
                      minzoom: 10,
                    });
                  }
                });
              });
          });
        });
    };

    map.on("load", fetchVisibleTracks);
    map.on("moveend", fetchVisibleTracks);

    return () => map.remove();
  }, []);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
