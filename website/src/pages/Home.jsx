// src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";

// Image imports (make sure these files exist under src/assets/)
import wildcatMap from "../assets/wildcat-map.jpg";
import brimestone from "../assets/brimestone.jpg";
import forestHero from "../assets/forest-hero.jpg";

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900 font-[Quicksand]">
      {/* Hero Section */}
      <section
        className="relative flex items-center justify-center text-white"
        style={{
          height: "85vh",
          backgroundImage: `url(${forestHero})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 z-0"></div>
        <div className="relative z-10 text-center -mt-8">
          <h2
            className="text-5xl md:text-6xl font-extrabold mb-14"
            style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.6)" }}
          >
            KNOW WHERE YOU ARE GOING
          </h2>
          <img
            src={wildcatMap}
            alt="Wildcat Adventures Off-Road Park"
            className="mx-auto max-w-md"
          />
          <p className="text-sm italic mt-2">
            Wildcat Adventures Off-Road Park
          </p>
        </div>
      </section>

      {/* Feature: Maps */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center px-6">
          <img
            src={brimestone}
            alt="Brimstone"
            className="mx-auto max-w-md"
          />
          <div>
            <h3 className="text-2xl font-semibold mb-4">Maps</h3>
            <p>
              We have a large list of trails and parks — and we’re constantly
              adding more!
            </p>
          </div>
        </div>
      </section>

      {/* Feature: Multi-Device */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center px-6">
          <div>
            <h3 className="text-2xl font-semibold mb-4">
              Use On Multiple Devices
            </h3>
            <p>
              You can use our GPX maps on phones, tablets, and off-road apps like
              Gaia GPS and OnX Offroad.
            </p>
          </div>
          <img
            src={wildcatMap}
            alt="Wildcat Adventures Off-Road Park"
            className="rounded-lg shadow-lg"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-green-100 text-center">
        <h3 className="text-2xl font-bold mb-4">Try It For Yourself</h3>
        <Link
          to="/maps"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition"
        >
          View All Maps
        </Link>
        <p className="mt-6 text-gray-700 text-lg max-w-xl mx-auto">
          Don’t want to go through the hassle of downloading files and importing
          them?
          <a
            href="https://mytrailmapspages.pages.dev/"
            className="text-green-700 font-semibold hover:underline ml-1"
            target="_blank"
            rel="noopener"
          >
            Try our app!
          </a>
          All parks are included — and more.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-sm py-6">
        <div className="max-w-6xl mx-auto text-center">
          &copy; 2025 My Trail Maps. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
