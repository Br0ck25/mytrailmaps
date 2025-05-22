import L from "leaflet";
import "leaflet-gpx";

export default class CustomGPX extends L.GPX {
  constructor(gpxText, options = {}) {
    super(gpxText, {
      ...options,
      async: true,
      marker_options: {
        startIconUrl: null,
        endIconUrl: null,
        shadowUrl: null,
      },
      polyline_options: {
        color: "#3388ff",
        weight: 3,
      },
      parseElements: ["track", "waypoint"], // ✅ keep waypoints
    });
  }

  // ⛔ Disable start/end auto markers
  _setStartEndIcons() {}

  // ✅ Support embedded track color via <extensions><color>
  _addSegment(points, name) {
    const color = this._getColorFromExtensions(this._xml);
    const polyline = L.polyline(points, {
      ...this.options.polyline_options,
      color: color || this.options.polyline_options.color,
    });
    this.addLayer(polyline);
    return polyline;
  }

  _getColorFromExtensions(xml) {
    try {
      const trk = xml.querySelector("trk extensions color");
      if (trk) return trk.textContent.trim();
    } catch (e) {}
    return null;
  }

  // ✅ Only add waypoints that have a name
  _parse_waypoints(xml) {
    const namespace = "http://www.topografix.com/GPX/1/1";
    const waypoints = xml.getElementsByTagNameNS(namespace, "wpt");

    for (let i = 0; i < waypoints.length; i++) {
      const wpt = waypoints[i];

      const nameEl = wpt.getElementsByTagNameNS(namespace, "name")[0];
      if (!nameEl || !nameEl.textContent.trim()) continue;

      const lat = parseFloat(wpt.getAttribute("lat"));
      const lon = parseFloat(wpt.getAttribute("lon"));
      const name = nameEl.textContent.trim();
      const descEl = wpt.getElementsByTagNameNS(namespace, "desc")[0];
      const desc = descEl ? descEl.textContent.trim() : "";

      const marker = L.marker([lat, lon]).bindPopup(`<strong>${name}</strong><br>${desc}`);
      this.addLayer(marker);
    }
  }
}
