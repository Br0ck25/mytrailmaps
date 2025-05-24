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
    console.log("✅ CustomGPX _parse called");

    const GPX_NS = "http://www.topografix.com/GPX/1/1";
    const GPX_STYLE_NS = "http://www.topografix.com/GPX/gpx_style/0/2";

    const parser = new DOMParser();
    const gpx = parser.parseFromString(this._gpxText, "application/xml");

    // ✅ Tracks and segments
    const trks = [...gpx.getElementsByTagNameNS(GPX_NS, "trk")];
    let totalSegments = 0;

    trks.forEach((trk) => {
      const colorEl =
        trk.getElementsByTagNameNS(GPX_STYLE_NS, "color")[0] ||
        trk.getElementsByTagName("color")[0]; // fallback if gpx_style is missing
      const color = colorEl?.textContent?.trim() || this._options.polyline_options.color;

      const trksegs = [...trk.getElementsByTagNameNS(GPX_NS, "trkseg")];
      trksegs.forEach((trkseg) => {
        const pts = [...trkseg.getElementsByTagNameNS(GPX_NS, "trkpt")].map((pt) => [
          parseFloat(pt.getAttribute("lat")),
          parseFloat(pt.getAttribute("lon")),
        ]);

        if (pts.length) {
          totalSegments++;
          const polyline = L.polyline(pts, {
            ...this._options.polyline_options,
            color,
          });
          polyline.addTo(this);
        }
      });
    });

    if (totalSegments === 0) {
      console.warn("⚠️ No track segments found in GPX");
    }

    // ✅ Named waypoints only
    const waypoints = [...gpx.getElementsByTagNameNS(GPX_NS, "wpt")];
    waypoints.forEach((wpt) => {
      const name = wpt.getElementsByTagNameNS(GPX_NS, "name")[0]?.textContent?.trim();
      if (!name) return;

      const lat = parseFloat(wpt.getAttribute("lat"));
      const lon = parseFloat(wpt.getAttribute("lon"));
      const desc = wpt.getElementsByTagNameNS(GPX_NS, "desc")[0]?.textContent?.trim() || "";

      const marker = L.marker([lat, lon], this._options.marker_options)
        .bindPopup(`<strong>${name}</strong><br>${desc}`);
      marker.addTo(this);
    });

    // ✅ Fit bounds
    const allLines = this.getLayers().filter((l) => l instanceof L.Polyline);
    if (allLines.length > 0) {
      const bounds = L.latLngBounds([]);
      allLines.forEach((line) => bounds.extend(line.getBounds()));
      this.fire("loaded", { bounds });
    }
  }
}
