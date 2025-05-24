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

    const parser = new DOMParser();
    const gpx = parser.parseFromString(this._gpxText, "application/xml");

    const allElements = gpx.querySelectorAll("*");

    // ✅ Tracks with per-track color support
    const trks = [...allElements].filter(el => el.tagName.endsWith("trk"));
    trks.forEach((trk) => {
      // Try to find color inside extensions
      const colorEl = trk.querySelector("extensions > color, extensions color");
      const color = colorEl?.textContent?.trim() || this._options.polyline_options.color;

      const trksegs = [...trk.querySelectorAll("*")].filter(el => el.tagName.endsWith("trkseg"));
      trksegs.forEach((trkseg) => {
        const pts = [...trkseg.children]
          .filter(el => el.tagName.endsWith("trkpt"))
          .map((pt) => [
            parseFloat(pt.getAttribute("lat")),
            parseFloat(pt.getAttribute("lon")),
          ]);

        if (pts.length) {
          const polyline = L.polyline(pts, {
            ...this._options.polyline_options,
            color,
          });
          polyline.addTo(this);
        }
      });
    });

    // ✅ Named waypoints
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
