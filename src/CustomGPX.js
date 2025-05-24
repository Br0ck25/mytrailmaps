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

    // 🔧 Remove all XML namespace declarations and prefixes
    const cleanXML = this._gpxText
      .replace(/<\?xml[^>]+\?>/, "")                        // Remove XML declaration
      .replace(/xmlns(:\w+)?="[^"]*"/g, "")                 // Remove xmlns attributes
      .replace(/(<\/?)[a-zA-Z0-9]+:/g, "$1");               // Remove gpx: and gpxx: prefixes

    const parser = new DOMParser();
    const gpx = parser.parseFromString(cleanXML, "application/xml");

    if (!gpx || gpx.getElementsByTagName("trkseg").length === 0) {
      console.warn("❌ No track segments found — GPX may not be parsed correctly");
      return;
    }

    // ✅ Tracks from <trkseg> + <trkpt>
    const trksegs = [...gpx.getElementsByTagName("trkseg")];
    trksegs.forEach((trkseg) => {
      const pts = [...trkseg.getElementsByTagName("trkpt")].map((pt) => [
        parseFloat(pt.getAttribute("lat")),
        parseFloat(pt.getAttribute("lon")),
      ]);

      if (pts.length) {
        const polyline = L.polyline(pts, {
          ...this._options.polyline_options,
        });
        polyline.addTo(this);
      }
    });

    // ✅ Named <wpt> markers only
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

    // ✅ Fit bounds to all track lines
    const allLines = this.getLayers().filter((l) => l instanceof L.Polyline);
    if (allLines.length > 0) {
      const bounds = L.latLngBounds([]);
      allLines.forEach((line) => bounds.extend(line.getBounds()));
      this.fire("loaded", { bounds });
    }
  }
}
