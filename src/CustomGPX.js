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
    this._trackLabels = [];
    this._waypointMarkers = [];
    this._waypointLabels = [];
    this._parse();
  }

  _parse() {
    const parser = new DOMParser();
    const gpx = parser.parseFromString(this._gpxText, "application/xml");
    const allElements = gpx.querySelectorAll("*");

    const trks = [...allElements].filter(el => el.tagName.endsWith("trk"));
    let totalSegments = 0;

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
        const pts = trkpts.map((pt) => [
          parseFloat(pt.getAttribute("lat")),
          parseFloat(pt.getAttribute("lon")),
        ]);

        if (pts.length) {
          totalSegments++;
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
            })
              .setContent(trkName)
              .setLatLng(mid);
            this._trackLabels.push(label);
            if (this._options.showTrackNames) {
              this.addLayer(label);
            }
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
      const descEl = [...wpt.children].find(c => c.tagName.endsWith("desc"));
      const desc = descEl?.textContent?.trim() || "";

      const marker = L.marker([lat, lon], this._options.marker_options)
        .bindPopup(`<strong>${nameEl.textContent.trim()}</strong><br>${desc}`);
      this._waypointMarkers.push(marker);
      if (this._options.showWaypoints) {
        marker.addTo(this);
      }

      const label = L.tooltip({
        permanent: true,
        direction: "top",
        className: "gpx-waypoint-label",
        offset: [0, -15],
      })
        .setContent(nameEl.textContent.trim())
        .setLatLng([lat, lon]);
      this._waypointLabels.push(label);
      if (this._options.showWaypointLabels) {
        this.addLayer(label);
      }
    });

    const allLines = this.getLayers().filter((l) => l instanceof L.Polyline);
    if (allLines.length > 0) {
      const bounds = L.latLngBounds([]);
      allLines.forEach((line) => bounds.extend(line.getBounds()));
      this.fire("loaded", { bounds });
    }
  }

  setShowTracks(visible) {
    this._trackPolylines.forEach(polyline => {
      if (visible) {
        this.addLayer(polyline);
      } else {
        this.removeLayer(polyline);
      }
    });
  }

  setShowTrackNames(visible) {
    this._trackLabels.forEach(label => {
      if (visible) {
        this.addLayer(label);
      } else {
        this.removeLayer(label);
      }
    });
  }

  setShowWaypoints(visible) {
    this._waypointMarkers.forEach(marker => {
      if (visible) {
        this.addLayer(marker);
      } else {
        this.removeLayer(marker);
      }
    });
  }

  setShowWaypointLabels(visible) {
    this._waypointLabels.forEach(label => {
      if (visible) {
        this.addLayer(label);
      } else {
        this.removeLayer(label);
      }
    });
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
