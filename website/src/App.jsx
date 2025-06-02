// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Maps from "./pages/Maps";
import MapDetailPage from "./pages/MapDetailPage";

function App() {
  return (
    <BrowserRouter>
      {/* Render the shared NavBar at the top of every page */}
      <NavBar />

      <main>
        <Routes>
          {/* Home page */}
          <Route path="/" element={<Home />} />

          {/* Maps listing page */}
          <Route path="/maps" element={<Maps />} />

          {/*
            “Hidden” detail page for any map, matched by its slug.
            i.e. /Brimstone-Map/, /black-mountain-off-road-adventure-area-map/, etc.
          */}
          <Route path="/:slug" element={<MapDetailPage />} />

          {/* …any other static routes (e.g. /how-to, /contact) */}
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
