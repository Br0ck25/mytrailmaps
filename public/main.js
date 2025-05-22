window.addEventListener("DOMContentLoaded", () => {
  const overlayPanel = document.getElementById("overlay-panel");
  const openOverlay = document.getElementById("btn-overlays");
  const closeOverlay = document.getElementById("close-overlay");

  openOverlay?.addEventListener("click", () => {
    overlayPanel.classList.remove("hidden");
  });

  closeOverlay?.addEventListener("click", () => {
    overlayPanel.classList.add("hidden");
  });

  document.getElementById("btn-saved")?.addEventListener("click", () => {
    alert("Saved Items Clicked");
  });

  document.getElementById("btn-waypoint")?.addEventListener("click", () => {
    alert("Create Waypoint");
  });

  document.getElementById("btn-route")?.addEventListener("click", () => {
    alert("Create Route");
  });

  document.getElementById("btn-import")?.addEventListener("click", () => {
    alert("Import Data");
  });
});
