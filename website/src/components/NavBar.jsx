// src/components/NavBar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between py-4">
        {/* Logo + Site Name */}
        <NavLink to="/" className="flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="My Trail Maps Logo"
            className="h-10 w-10 object-contain"
          />
          <span className="text-2xl font-bold text-gray-800">
            My Trail Maps
          </span>
        </NavLink>

        {/* Navigation Links */}
        <ul className="flex space-x-6 text-base font-medium">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/maps"
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              Maps
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/gps-apps"
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              GPS Apps
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/how-to"
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              How To
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/offroad-parks"
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              Offroad Parks
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              Products
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/offroad-blog"
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              Offroad Blog
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              About
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/more"
              className={({ isActive }) =>
                isActive
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-700"
              }
            >
              More
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
