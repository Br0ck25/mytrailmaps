import L from "leaflet";
import simplify from 'simplify-js';
import { glify } from 'leaflet.glify';

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

    this._trackLabelGroup = L.layerGroup();
    this._waypointMarkerGroup = L.layerGroup();
    this._waypointLabelGroup = L.layerGroup();

    this.once("add", () => {
      this._map = this._map || this._layerAdd?._map || this._map;
      this._parse();
    });
  }

  _parse() {
    const parser = new DOMParser();
    const gpx = parser.parseFromString(this._gpxText, "application/xml");
    const allElements = gpx.querySelectorAll("*");

    const allPts = [];

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
        const rawPts = trkpts
          .map(pt => {
            const lat = parseFloat(pt.getAttribute("lat"));
            const lon = parseFloat(pt.getAttribute("lon"));
            if (isNaN(lat) || isNaN(lon)) return null;
            return { x: lon, y: lat };
          })
          .filter(p => p !== null);

        if (rawPts.length < 2) return;

        const zoom = this._map?.getZoom?.() ?? 13;
        const tolerance = zoom >= 13 ? 0 : zoom >= 10 ? 0.0005 : 0.001;

        const simplified = simplify(rawPts, tolerance, true);
        const pts = simplified.map(p => [p.y, p.x]);

        if (pts.length >= 2) {
          allPts.push(...pts);

          const trkName = [...trk.children].find(c => c.tagName.endsWith("name"))?.textContent?.trim();
          if (trkName) {
            const mid = pts[Math.floor(pts.length / 2)];
            const label = L.tooltip({
              permanent: true,
              direction: "center",
              className: "gpx-track-label",
            }).setContent(trkName).setLatLng(mid);

            this._trackLabelGroup.addLayer(label);
          }
        }
      });
    });

    if (allPts.length >= 2 && this._options.showTracks) {
      const glLayer = glify.lines({
        map: this._map,
        data: allPts,
        weight: this._options.polyline_options.weight || 3,
        color: this._options.polyline_options.color,
        opacity: 1,
        click: e => console.log('Track clicked', e)
      });

      this._trackPolylines.push(glLayer);
    }

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

    if (this._options.showTrackNames) this.addLayer(this._trackLabelGroup);
    if (this._options.showWaypoints) this.addLayer(this._waypointMarkerGroup);
    if (this._options.showWaypointLabels) this.addLayer(this._waypointLabelGroup);
  }

  setShowTracks(visible) {
    this._trackPolylines.forEach(glLayer => {
      if (glLayer?.canvas) {
        glLayer.canvas.style.display = visible ? '' : 'none';
      }
    });
  }

  setShowTrackNames(visible) {
    if (visible) this.addLayer(this._trackLabelGroup);
    else this.removeLayer(this._trackLabelGroup);
  }

  setShowWaypoints(visible) {
    if (visible) this.addLayer(this._waypointMarkerGroup);
    else this.removeLayer(this._waypointMarkerGroup);
  }

  setShowWaypointLabels(visible) {
    if (visible) this.addLayer(this._waypointLabelGroup);
    else this.removeLayer(this._waypointLabelGroup);
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
