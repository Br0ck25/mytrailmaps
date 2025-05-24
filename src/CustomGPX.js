import L from "leaflet";

export default class CustomGPX extends L.FeatureGroup {
  constructor(gpxText, options = {}) {
    super();

    this._gpxText = gpxText;
    this._options = {
      polyline_options: { color: "#3388ff", weight: 3 },
      marker_options: {},
      ...options,
    };

    this._parse();
  }

  _parse() {
    const parser = new DOMParser();
    const gpx = parser.parseFromString(this._gpxText, "application/xml");

    // ✅ Render tracks with embedded color if available
    const trks = [...gpx.getElementsByTagName("trk")];
    trks.forEach((trk) => {
      const colorEl = trk.querySelector("extensions color");
      const color = colorEl?.textContent?.trim() || this._options.polyline_options.color;

      const trksegs = [...trk.getElementsByTagName("trkseg")];
      trksegs.forEach((trkseg) => {
        const pts = [...trkseg.getElementsByTagName("trkpt")].map((pt) => [
          parseFloat(pt.getAttribute("lat")),
          parseFloat(pt.getAttribute("lon")),
        ]);

        if (pts.length) {
          const polyline = L.polyline(pts, { ...this._options.polyline_options, color });
          polyline.addTo(this);
        }
      });
    });

    // ✅ Render only <wpt> with <name>
    const waypoints = [...gpx.getElementsByTagName("wpt")];
    waypoints.forEach((wpt) => {
      const name = wpt.getElementsByTagName("name")[0]?.textContent?.trim();
      if (!name) return;

      const lat = parseFloat(wpt.getAttribute("lat"));
      const lon = parseFloat(wpt.getAttribute("lon"));
      const desc = wpt.getElementsByTagName("desc")[0]?.textContent?.trim() || "";

      const marker = L.marker([lat, lon], this._options.marker_options)
        .bindPopup(`<strong>${name}</strong><br>${desc}`);
      marker.addTo(this);
    });

    // ✅ Fit bounds to all tracks
    const allLines = this.getLayers().filter((l) => l instanceof L.Polyline);
    if (allLines.length > 0) {
      const bounds = L.latLngBounds([]);
      allLines.forEach((line) => bounds.extend(line.getBounds()));
      this.fire("loaded", { bounds });
    }
  }
}
