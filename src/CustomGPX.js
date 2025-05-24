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

  // Test marker
  L.marker([37.123, -83.456])
    .addTo(this)
    .bindPopup("Test Marker");
  console.log("📍 Marker added");

  // Test line
  const polyline = L.polyline([
    [37.123, -83.456],
    [37.124, -83.457],
  ], {
    color: "#FF0000",
    weight: 3,
  }).addTo(this);
  console.log("🟥 Test line added");

    const parser = new DOMParser();
    const gpx = parser.parseFromString(this._gpxText, "application/xml");

    // ✅ Render tracks with embedded color if available
let parsedAny = false;

// Try parsing <trk><trkseg>
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
      parsedAny = true;
      L.polyline(pts, { ...this._options.polyline_options, color }).addTo(this);
    }
  });
});

// Fallback: parse all <trkseg> globally if <trk> failed
if (!parsedAny) {
  console.log("⚠️ No <trk> found, using global <trkseg>");
  const trksegs = [...gpx.getElementsByTagName("trkseg")];
  trksegs.forEach((trkseg) => {
    const pts = [...trkseg.getElementsByTagName("trkpt")].map((pt) => [
      parseFloat(pt.getAttribute("lat")),
      parseFloat(pt.getAttribute("lon")),
    ]);
    if (pts.length) {
      L.polyline(pts, {
        ...this._options.polyline_options,
        color: this._options.polyline_options.color, // fallback
      }).addTo(this);
    }
  });
}


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
