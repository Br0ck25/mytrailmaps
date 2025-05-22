import L from "leaflet";
import "leaflet-gpx";

export default class CustomGPX extends L.GPX {
  constructor(gpxText, options = {}) {
    const clean = gpxText.replace(/<\s*wpt[\s\S]*?>[\s\S]*?<\s*\/\s*wpt\s*>/g, ''); // Optional if you re-add later
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
      parseElements: ["track", "waypoint"], // 👈 enable waypoints
    });
  }

  // 👇 override to skip default start/end markers
  _setStartEndIcons() {}

  // 👇 override to apply color from extensions if present
  _addSegment(points, name) {
    const color = this._getColorFromExtensions(this._xml); // check once per GPX
    const polyline = L.polyline(points, {
      ...this.options.polyline_options,
      color: color || this.options.polyline_options.color,
    });
    this.addLayer(polyline);
    return polyline;
  }

  // ✅ extract color from <extensions> if found
  _getColorFromExtensions(xml) {
    try {
      const trk = xml.querySelector("trk extensions color");
      if (trk) return trk.textContent.trim();
    } catch (e) {}
    return null;
  }
}
