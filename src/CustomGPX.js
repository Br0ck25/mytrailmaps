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

    const trks = Array.from(gpx.getElementsByTagName("trk"));
    trks.forEach((trk) => {
      let color = this._options.polyline_options.color;

      // Try to find a <color> in any extensions block
      const extensions = trk.getElementsByTagName("extensions")[0];
      if (extensions) {
        const colorEl = extensions.querySelector("color");
        if (colorEl && colorEl.textContent.trim()) {
          color = colorEl.textContent.trim();
        }
      }

      const trksegs = Array.from(trk.getElementsByTagName("trkseg"));
      trksegs.forEach((trkseg) => {
        const pts = Array.from(trkseg.getElementsByTagName("trkpt")).map((pt) => [
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

    // ✅ Named waypoints only
    const waypoints = Array.from(gpx.getElementsByTagName("wpt"));
    waypoints.forEach((wpt) => {
      const nameEl = wpt.getElementsByTagName("name")[0];
      if (!nameEl || !nameEl.textContent.trim()) return;

      const lat = parseFloat(wpt.getAttribute("lat"));
      const lon = parseFloat(wpt.getAttribute("lon"));
      const descEl = wpt.getElementsByTagName("desc")[0];
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
    } else {
      console.warn("⚠️ No track segments rendered.");
    }
  }
}
