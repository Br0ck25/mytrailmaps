import L from "leaflet";

export default class CustomGPX extends L.FeatureGroup {
  constructor(gpxText, options = {}) {
    super();

    this._gpxText = gpxText;
    this._options = {
      polyline_options: { color: "#3388ff", weight: 3 },
      marker_options: {},
      showTrackNames: true,
      showWaypoints: true,
      showWaypointLabels: true,
      showTracks: true,
      ...options,
    };

    this._trackPolylines = [];
    this._labelVisibleMap = new Map();

    // 🧱 Layer groups for performance
    this._trackLabelGroup = L.layerGroup();
    this._waypointMarkerGroup = L.layerGroup();
    this._waypointLabelGroup = L.layerGroup();

    this._map = null;

    this._parse();
  }

  _parse() {
    const parser = new DOMParser();
    const gpx = parser.parseFromString(this._gpxText, "application/xml");
    const allElements = gpx.querySelectorAll("*");

    const trks = [...allElements].filter(el => el.tagName.endsWith("trk"));
    trks.forEach((trk) => {
      let color = this._options.polyline_options.color;

      const extensions = [...trk.children].find(c => c.tagName.endsWith("extensions"));
      if (extensions) {
        const colorTag = [...extensions.getElementsByTagName("*")].find(c =>
          c.tagName.toLowerCase().endsWith("displaycolor") || c.tagName.toLowerCase().endsWith("color")
        );
        if (colorTag && colorTag.textContent.trim()) {
          color = this._mapDisplayColor(colorTag.textContent.trim());
        }
      }

      const trksegs = [...trk.getElementsByTagName("*")].filter(el => el.tagName.endsWith("trkseg"));
      trksegs.forEach((trkseg) => {
        const trkpts = [...trkseg.children].filter(el => el.tagName.endsWith("trkpt"));
        const pts = trkpts.map(pt => [parseFloat(pt.getAttribute("lat")), parseFloat(pt.getAttribute("lon"))]);

        if (pts.length) {
          const polyline = L.polyline(pts, {
            ...this._options.polyline_options,
            color,
          });
          this._trackPolylines.push(polyline);
          if (this._options.showTracks) {
            polyline.addTo(this);
          }

          const trkName = [...trk.children].find(c => c.tagName.endsWith("name"))?.textContent?.trim();
          if (trkName) {
            const mid = pts[Math.floor(pts.length / 2)];
            const label = L.tooltip({
              permanent: true,
              direction: "center",
              className: "gpx-track-label",
            }).setContent(trkName).setLatLng(mid);

            this._trackLabelGroup.addLayer(label);
            this._labelVisibleMap.set(polyline, this._options.showTrackNames);

            polyline.on("click", () => {
              const visible = this._labelVisibleMap.get(polyline);
              if (visible) {
                this._trackLabelGroup.removeLayer(label);
              } else {
                this._trackLabelGroup.addLayer(label);
              }
              this._labelVisibleMap.set(polyline, !visible);
            });
          }
        }
      });
    });

    const waypoints = [...allElements].filter(el => el.tagName.endsWith("wpt"));
    waypoints.forEach((wpt) => {
      const nameEl = [...wpt.children].find(c => c.tagName.endsWith("name"));
      if (!nameEl || !nameEl.textContent.trim()) return;

      const lat = parseFloat(wpt.getAttribute("lat"));
      const lon = parseFloat(wpt.getAttribute("lon"));
      const desc = [...wpt.children].find(c => c.tagName.endsWith("desc"))?.textContent?.trim() || "";

      const marker = L.marker([lat, lon], this._options.marker_options)
        .bindPopup(`<strong>${nameEl.textContent.trim()}</strong><br>${desc}`);
      this._waypointMarkerGroup.addLayer(marker);

      const label = L.tooltip({
        permanent: true,
        direction: "top",
        className: "gpx-waypoint-label",
        offset: [0, -15],
      }).setContent(nameEl.textContent.trim()).setLatLng([lat, lon]);
      this._waypointLabelGroup.addLayer(label);
    });

    // Add layers conditionally after zoom logic
    this._map = this._trackPolylines[0]?.__map || this._waypointMarkerGroup._map;
    if (this._map) {
      this._map.on("zoomend", () => this._onZoomChanged());
      this._onZoomChanged();
    }

    const allLines = this.getLayers().filter((l) => l instanceof L.Polyline);
    if (allLines.length > 0) {
      const bounds = L.latLngBounds([]);
      allLines.forEach((line) => bounds.extend(line.getBounds()));
      this.fire("loaded", { bounds });
    }
  }

  _onZoomChanged() {
    if (!this._map) return;

    const zoom = this._map.getZoom();

    if (this._options.showTrackNames) {
      if (zoom >= 13) this.addLayer(this._trackLabelGroup);
      else this.removeLayer(this._trackLabelGroup);
    }

    if (this._options.showWaypoints) {
      if (zoom >= 12) this.addLayer(this._waypointMarkerGroup);
      else this.removeLayer(this._waypointMarkerGroup);
    }

    if (this._options.showWaypointLabels) {
      if (zoom >= 13) this.addLayer(this._waypointLabelGroup);
      else this.removeLayer(this._waypointLabelGroup);
    }
  }

  setShowTracks(visible) {
    this._trackPolylines.forEach(polyline => {
      if (visible) this.addLayer(polyline);
      else this.removeLayer(polyline);
    });
  }

  setShowTrackNames(visible) {
    this._options.showTrackNames = visible;
    this._trackPolylines.forEach(polyline => {
      this._labelVisibleMap.set(polyline, visible);
    });
    this._onZoomChanged();
  }

  setShowWaypoints(visible) {
    this._options.showWaypoints = visible;
    this._onZoomChanged();
  }

  setShowWaypointLabels(visible) {
    this._options.showWaypointLabels = visible;
    this._onZoomChanged();
  }

  _mapDisplayColor(displayColorName) {
    const hex = displayColorName.trim();
    if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex}`;
    const map = {
      "DarkRed": "#8B0000",
      "DarkGreen": "#006400",
      "DarkBlue": "#00008B",
      "Purple": "#800080",
      "DarkCyan": "#008B8B",
      "Magenta": "#FF00FF",
      "Gray": "#808080",
      "Black": "#000000",
      "LightGray": "#D3D3D3",
      "DarkYellow": "#B8860B",
      "Yellow": "#FFFF00",
      "Red": "#FF0000",
      "Green": "#00FF00",
      "Blue": "#0000FF",
    };
    return map[hex] || "#3388ff";
  }
}
