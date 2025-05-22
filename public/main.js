window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-overlays").addEventListener("click", () => {
    alert("Map Overlays clicked");
  });
  document.getElementById("btn-saved").addEventListener("click", () => {
    alert("Saved Items clicked");
  });
  document.getElementById("btn-waypoint").addEventListener("click", () => {
    alert("Waypoint creation coming soon");
  });
  document.getElementById("btn-route").addEventListener("click", () => {
    alert("Route creation coming soon");
  });
  document.getElementById("btn-import").addEventListener("click", () => {
    alert("Import dialog coming soon");
  });
  document.getElementById("btn-overlays").addEventListener("click", () => {
  document.getElementById("overlay-panel").classList.remove("hidden");
});

document.getElementById("close-overlay").addEventListener("click", () => {
  document.getElementById("overlay-panel").classList.add("hidden");
});

});
