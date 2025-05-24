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

    // ✅ Tracks (ignore namespace)
    const trks = [...allElements].filter(el => el.tagName.endsWith("trk"));
    let totalSegments = 0;

    trks.forEach((trk) => {
      // Get <DisplayColor> from <extensions>
      let color = this._options.polyline_options.color;

      const extensions = [...trk.children].find(c => c.tagName.endsWith("extensions"));
if (extensions) {
  const allExtensionChildren = [...extensions.getElementsByTagName("*")];
  const colorTag = allExtensionChildren.find(el =>
    el.tagName.toLowerCase().endsWith("displaycolor") ||
    el.tagName.toLowerCase().endsWith("color")
  );
  if (colorTag && colorTag.textContent.trim()) {
    const displayColor = colorTag.textContent.trim();
    color = this._mapDisplayColor(displayColor);
    console.log("🎨 Track color extracted (fallback):", displayColor, "→", color);
  } else {
    console.log("🎨 Still no <DisplayColor> tag found in extensions");
  }
} else {
  console.log("📭 No <extensions> found at all");
}


      const trksegs = [...trk.getElementsByTagName("*")].filter(el => el.tagName.endsWith("trkseg"));
      trksegs.forEach((trkseg) => {
        const trkpts = [...trkseg.children].filter(el => el.tagName.endsWith("trkpt"));
        const pts = trkpts.map((pt) => [
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

  _mapDisplayColor(displayColorName) {
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
    return map[displayColorName] || "#3388ff";
  }
}
