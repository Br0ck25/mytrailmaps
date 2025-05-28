import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const geojsonFiles = [
  "BlackMountainOffRoadAdventureArea.geojson",
  "BlueHollerOff-RoadPark.geojson",
  "Brimstone2023.geojson",
  "BryantGroveTrail.geojson",
  "CarolinaAdventureWorld.geojson",
  "DirtyTurtleOff-RoadParkDTOR.geojson",
  "FlatNastyOff-RoadPark.geojson",
  "GoldenMountainPark.geojson",
  "HatfieldMcCoyTrails-Bearwallow.geojson",
  "HatfieldMcCoyTrails-Warrior.geojson",
  "HawkPrideOff-Road.geojson",
  "Hollerwood.geojson",
  "KentuckyAdventureTrail.geojson",
  "leatherwood-off-road-park.geojson",
  "MineMadeAdventurePark.geojson",
  "PatawomackAdventurePark.geojson",
  "PickettStateForestOHVTrailMap.geojson",
  "RedbirdCrestTrailSystem.geojson"
];

export default function MapView({
  showTracks,
  showNames,
  showWaypoints,
  showWaypointLabels,
  onGeolocateControlReady
}) {
  const mapRef = useRef(null);
  const currentMap = useRef(null);

  useEffect(() => {
    const map = currentMap.current;
    if (!map || !map.getStyle()) return;

    map.getStyle().layers?.forEach((layer) => {
      const id = layer.id;
      if (id.endsWith("-line")) {
        map.setPaintProperty(id, "line-opacity", showTracks ? 1 : 0);
      }
      if (id.endsWith("-label")) {
        map.setLayoutProperty(id, "visibility", showNames ? "visible" : "none");
      }
      if (id.endsWith("-waypoints")) {
        map.setLayoutProperty(id, "visibility", showWaypoints ? "visible" : "none");
      }
      if (id.endsWith("-waypoint-labels")) {
        map.setLayoutProperty(id, "visibility", showWaypointLabels ? "visible" : "none");
      }
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

    // Add after geolocate definition
map.on("load", () => {
  // ✅ Wait until the map finishes rendering everything (controls too)
  map.once("idle", () => {
    if (onGeolocateControlReady && typeof onGeolocateControlReady === "function") {
      onGeolocateControlReady(() => {
        if (geolocate && typeof geolocate.trigger === "function") {
          geolocate.trigger();
        }
      });
    }
  });




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
            map.on("mouseenter", lineId, () => {
  map.getCanvas().style.cursor = "pointer";
});
map.on("mouseleave", lineId, () => {
  map.getCanvas().style.cursor = "";
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

      // ✅ Show popup with name + description
      map.on("click", (e) => {
        const layersToCheck = map.getStyle().layers.filter((l) =>
          l.id.endsWith("-line")
        ).map((l) => l.id);

        const features = map.queryRenderedFeatures(e.point, { layers: layersToCheck });
        if (features.length > 0) {
          const props = features[0].properties;
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

    return () => map.remove();
  }, []);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
