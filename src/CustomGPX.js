import L from "leaflet";

// Clone of L.GPX that strips out start/end markers entirely
export default class CustomGPX extends L.FeatureGroup {
  constructor(gpxText, options = {}) {
    super();

    this._gpxText = gpxText;
    this._options = {
      async: true,
      polyline_options: { color: "#3388ff", weight: 3 },
      ...options,
    };

    this._parse();
  }

  _parse() {
    const parser = new DOMParser();
    const gpx = parser.parseFromString(this._gpxText, "application/xml");
    const trksegs = [...gpx.getElementsByTagName("trkseg")];

    const lines = trksegs.map((trkseg) => {
      const pts = [...trkseg.getElementsByTagName("trkpt")].map((pt) => [
        parseFloat(pt.getAttribute("lat")),
        parseFloat(pt.getAttribute("lon")),
      ]);
      return L.polyline(pts, this._options.polyline_options).addTo(this);
    });

    // Optional: fit bounds
    if (lines.length > 0) {
      const bounds = L.latLngBounds([]);
      lines.forEach((line) => bounds.extend(line.getBounds()));
      this.fire("loaded", { bounds });
    }
  }
}
