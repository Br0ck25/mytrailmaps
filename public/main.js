window.addEventListener("DOMContentLoaded", () => {
  const panels = {
    "btn-saved": "saved-panel"
  };

  Object.entries(panels).forEach(([btnId, panelId]) => {
    document.getElementById(btnId)?.addEventListener("click", () => {
      Object.values(panels).forEach(id => document.getElementById(id)?.classList.add("hidden"));
      document.getElementById(panelId)?.classList.remove("hidden");
    });
  });

  document.querySelectorAll(".close-btn").forEach(btn => {
    const targetId = btn.getAttribute("data-close");
    btn.addEventListener("click", () => {
      document.getElementById(targetId)?.classList.add("hidden");
    });
  });
});
