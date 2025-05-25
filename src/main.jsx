import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ✅ React app render
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Register PWA service worker for offline support
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });
