import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { gpx as toGeoJSON } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";

export default function MapView({
  showTracks,
  showNames,
  showWaypoints,
  showWaypointLabels,
  onGeolocateControlReady
}) {
  const mapRef = useRef(null);
  const sourcesLoaded = useRef(new Set());
  const currentMap = useRef(null);

  const updateLayerVisibility = () => {
    const map = currentMap.current;
    if (!map || !map.getStyle()) return;

    map.getStyle().layers?.forEach(layer => {
      const id = layer.id;
      if (id.endsWith("-line")) {
        map.setPaintProperty(id, "line-opacity", showTracks ? 1 : 0);
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
    const extensions = Array.from(trkEl.childNodes).filter(n => n.nodeType === 1)
      .find(c => c.tagName.toLowerCase().endsWith("extensions"));
    if (!extensions) return fallback;

    const colorTag = [...extensions.getElementsByTagName("*")].find(c =>
      c.tagName.toLowerCase().endsWith("displaycolor") || c.tagName.toLowerCase().endsWith("color")
    );
    if (!colorTag || !colorTag.textContent.trim()) return fallback;

    const value = colorTag.textContent.trim();
    const hexColor = value.match(/^#?[0-9a-f]{6}$/i) ? `#${value.replace(/^#/, "")}` : null;

    const namedColors = {
      "DarkRed": "#8B0000", "DarkGreen": "#006400", "DarkBlue": "#00008B",
      "Purple": "#800080", "DarkCyan": "#008B8B", "Magenta": "#FF00FF",
      "Gray": "#808080", "Black": "#000000", "LightGray": "#D3D3D3",
      "DarkYellow": "#B8860B", "Yellow": "#FFFF00", "Red": "#FF0000",
      "Green": "#00FF00", "Blue": "#0000FF"
    };

    return hexColor || namedColors[value] || fallback;
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
if (mapRef) mapRef.current = map;

// ✅ Add compass-only navigation control
const navControl = new maplibregl.NavigationControl({
  showZoom: false, // disable zoom buttons
  visualizePitch: true
});
map.addControl(navControl, "bottom-left");

// ✅ Geolocate button
const geolocate = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true,
  showAccuracyCircle: false,
});
map.addControl(geolocate, "bottom-left"); // place next to compass

map.on("load", () => {
  if (onGeolocateControlReady) {
    setTimeout(() => {
      onGeolocateControlReady(() => geolocate.trigger());
    }, 0);
  }

  fetchVisibleTracks();
});



    map.on("moveend", () => {
      const center = map.getCenter();
      localStorage.setItem("mapCenter", JSON.stringify([center.lng, center.lat]));
      localStorage.setItem("mapZoom", map.getZoom());
      fetchVisibleTracks();
    });

    const fetchVisibleTracks = () => {
      const bounds = map.getBounds();
      const apiBase = import.meta.env.PROD
        ? "https://mytrailmapsworker.jamesbrock25.workers.dev/api"
        : "/api";

      const url = `${apiBase}/tracks-in-bounds?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}`;

      fetch(url)
        .then((res) => res.json())
        .then((slugs) => {
          slugs.forEach(({ slug }) => sourcesLoaded.current.delete(slug));

          map.getStyle().layers?.forEach(layer => {
            const id = layer.id;
            if (id.startsWith("track-")) {
              if (!slugs.find(s => id.includes(s.slug))) {
                if (map.getLayer(id)) map.removeLayer(id);
                const srcId = id.replace(/-(line|label)$/, "");
                if (map.getSource(srcId)) map.removeSource(srcId);
              }
            }
          });

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
                  const gpxDoc = new DOMParser().parseFromString("<gpx></gpx>", "application/xml");
                  gpxDoc.documentElement.appendChild(trkEl.cloneNode(true));
                  const geojson = toGeoJSON(gpxDoc);

                  geojson.features.forEach(f => {
                    if (f.geometry.type === "LineString") {
                      f.properties = { name: f.properties?.name };
                    } else {
                      delete f.properties;
                    }
                  });

                  const trackColor = parseTrackColor(trkEl);
                  const sourceId = `${slug}-trk-${index}`;

                  if (!map.getSource(sourceId)) {
                    map.addSource(sourceId, { type: "geojson", data: geojson });

                    map.addLayer({
                      id: `${sourceId}-line`,
                      type: "line",
                      source: sourceId,
                      layout: {
                        "line-join": "round",
                        "line-cap": "round",
                        visibility: "visible"
                      },
                      paint: {
                        "line-color": trackColor,
                        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 2, 15, 3],
                        "line-opacity": showTracks ? 1 : 0
                      }
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
                          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 14, 14],
                          visibility: showNames ? "visible" : "none"
                        },
                        paint: {
                          "text-color": "#333",
                          "text-halo-color": "#fff",
                          "text-halo-width": 2
                        },
                        filter: ["==", "$type", "LineString"],
                        minzoom: 10
                      });
                    }
                  }
                });

                const allGeoJSON = toGeoJSON(xml);
                const waypointFeatures = allGeoJSON.features.filter(f => f.geometry?.type === "Point");

                if (waypointFeatures.length > 0) {
                  const waypointSourceId = `${slug}-waypoints`;

                  if (!map.getSource(waypointSourceId)) {
                    map.addSource(waypointSourceId, {
                      type: "geojson",
                      data: {
                        type: "FeatureCollection",
                        features: waypointFeatures
                      }
                    });

                    map.addLayer({
                      id: `${waypointSourceId}-icons`,
                      type: "circle",
                      source: waypointSourceId,
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
                      id: `${waypointSourceId}-labels`,
                      type: "symbol",
                      source: waypointSourceId,
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
                  }
                }
              });
          });
        });
    };

    return () => map.remove();
  }, []);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
