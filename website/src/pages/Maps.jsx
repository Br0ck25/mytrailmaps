// src/pages/Maps.jsx
import React from "react";
import { Link } from "react-router-dom";

// Each map now includes the exact “slug” to match the existing mytrailmaps.net URLs.
const maps = [
  {
    name: "Black Hills All Vehicles Map",
    slug: "Black-Hills-All-Vehicles",
    price: "$5.00",
    image: "/assets/maps/black-hills-all-vehicles-map.jpg",
    id: "1735157",
  },
  {
    name: "Black Mountain Offroad Adventure Area Map",
    slug: "black-mountain-off-road-adventure-area-map",
    price: "$10.00",
    image: "/assets/maps/black-mountain-offroad-adventure-area-map.jpg",
    id: "1684261",
  },
  {
    name: "Blue Holler Offroad Park Map",
    slug: "blue-holler-off-road-park-map",
    price: "$10.00",
    image: "/assets/maps/blue-holler-offroad-park-map.jpg",
    id: "1684268",
  },
  {
    name: "Brimstone Map",
    slug: "brimstone-map",
    price: "$10.00",
    image: "/assets/maps/brimstone-map.jpg",
    id: "1684264",
  },
  {
    name: "Bryant Grove Trail Map",
    slug: "Bryant-Grove-Trail",
    price: "$2.00",
    image: "/assets/maps/bryant-grove-trail-map.jpg",
    id: "1687694",
  },
  {
    name: "Carolina Adventure World Map",
    slug: "carolina-adventure-world",
    price: "$10.00",
    image: "/assets/maps/carolina-adventure-world-map.jpg",
    id: "1687717",
  },
  {
    name: "Dirty Turtle Offroad Park DTOR Map",
    slug: "dirty-turtle-off-road-park-dtor",
    price: "$12.00",
    image: "/assets/maps/dirty-turtle-offroad-park-dtor-map.jpg",
    id: "1687689",
  },
  {
    name: "Flat Nasty Offroad Park Map",
    slug: "Flat-Nasty-Off-Road-Park",
    price: "$12.00",
    image: "/assets/maps/flat-nasty-offroad-park-map.jpg",
    id: "1687700",
  },
  {
    name: "Golden Mountain Park Map",
    slug: "Golden-Mountain-Park",
    price: "$5.00",
    image: "/assets/maps/golden-mountain-park-map.jpg",
    id: "1687695",
  },
  {
    name: "Hatfield McCoy Trails - Bearwallow Map",
    slug: "Hatfield-McCoy-Trails-Bearwallow",
    price: "$10.00",
    image: "/assets/maps/hatfield-mccoy-trails---bearwallow-map.jpg",
    id: "1687715",
  },
  {
    name: "Hatfield McCoy Trails - Warrior Map",
    slug: "Hatfield-McCoy-Trails-Warrior",
    price: "$8.00",
    image: "/assets/maps/hatfield-mccoy-trails---warrior-map.jpg",
    id: "1687716",
  },
  {
    name: "Hawk Pride Mountain Offroad Map",
    slug: "Hawk-Pride-Off-Road",
    price: "$12.00",
    image: "/assets/maps/hawk-pride-offroad-map.jpg",
    id: "1687696",
  },
  {
    name: "Hollerwood OffRoad Adventure Park Map",
    slug: "Hollerwood",
    price: "$10.00",
    image: "/assets/maps/hollerwood-offroad-adventure-park-map.jpg",
    id: "1737436",
  },
  {
    name: "Kentucky Adventure Trail Map",
    slug: "kentucky-adventure-trail",
    price: "$5.00",
    image: "/assets/maps/kentucky-adventure-trail-map.jpg",
    id: "1687690",
  },
  {
    name: "Leatherwood Offroad Map",
    slug: "Leatherwood-Off-Road-Park",
    price: "$12.00",
    image: "/assets/maps/leatherwood-offroad-map.jpg",
    id: "1792377",
  },
  {
    name: "Mine Made Adventure Park Map",
    slug: "mine-made-adventure-park",
    price: "$10.00",
    image: "/assets/maps/mine-made-adventure-park-map.jpg",
    id: "1687691",
  },
  {
    name: "Patawomack Adventure Park Map",
    slug: "Patawomack-Adventure-Park",
    price: "$8.00",
    image: "/assets/maps/patawomack-adventure-park-map.jpg",
    id: "1687697",
  },
  {
    name: "Pickett State Forest OHV Trail Map",
    slug: "pickett-state-forest-ohv-trail-map",
    price: "$10.00",
    image: "/assets/maps/pickett-state-forest-ohv-trail-map.jpg",
    id: "1684267",
  },
  {
    name: "Redbird Crest Trail System Map",
    slug: "Redbird-Crest-Trail-System",
    price: "$5.00",
    image: "/assets/maps/redbird-crest-trail-system-map.jpg",
    id: "1687692",
  },
  {
    name: "Rocky Ridge Offroad Park Map",
    slug: "Rocky-Ridge-Off-Road-Park",
    price: "$10.00",
    image: "/assets/maps/rocky-ridge-offroad-park-map.jpg",
    id: "1687706",
  },
  {
    name: "Royal Blue Map",
    slug: "royal-blue-map",
    price: "$10.00",
    image: "/assets/maps/royal-blue-map.jpg",
    id: "1684266",
  },
  {
    name: "Rush Offroad Map",
    slug: "rush-offroad-map",
    price: "$10.00",
    image: "/assets/maps/rush-offroad-map.jpg",
    id: "1684265",
  },
  {
    name: "Southern Missouri Offroad Ranch SMORR Map",
    slug: "southern-missouri-off-road-ranch-smorr",
    price: "$12.00",
    image: "/assets/maps/southern-missouri-offroad-ranch-smorr-map.jpg",
    id: "1687701",
  },
  {
    name: "Southington Offroad Park Map",
    slug: "Southington-Off-Road-Park",
    price: "$5.00",
    image: "/assets/maps/southington-offroad-park-map.jpg",
    id: "1687703",
  },
  {
    name: "Spearhead - Stone Mountain Map",
    slug: "Spearhead-Stone-Mountain",
    price: "$10.00",
    image: "/assets/maps/spearhead---stone-mountain-map.jpg",
    id: "1687714",
  },
  {
    name: "Spearhead Trails - Coal Canyon Map",
    slug: "Spearhead-Trails-Coal-Canyon",
    price: "$10.00",
    image: "/assets/maps/spearhead-trails---coal-canyon-map.jpg",
    id: "1687709",
  },
  {
    name: "Spearhead Trails - Jawbone and Coal Canyon at Jewell Valley Map",
    slug: "Spearhead-Trails-Jawbone-and-Coal-Canyon-at-Jewell-Valley",
    price: "$10.00",
    image:
      "/assets/maps/spearhead-trails---jawbone-and-coal-canyon-at-jewell-valley-map.jpg",
    id: "1687710",
  },
  {
    name: "Spearhead Trails - Mountain View Map",
    slug: "Spearhead-Trails-Mountain-View",
    price: "$10.00",
    image:
      "/assets/maps/spearhead-trails---mountain-view-map.jpg",
    id: "1687711",
  },
  {
    name: "Spearhead Trails - Original Pocahontas Map",
    slug: "Spearhead-Trails-Original-Pocahontas",
    price: "$10.00",
    image:
      "/assets/maps/spearhead-trails---original-pocahontas-map.jpg",
    id: "1687712",
  },
  {
    name: "Spearhead Trails - Ridgeview ATV Trail Map",
    slug: "Spearhead-Trails-Ridgeview-ATV-Trail",
    price: "$10.00",
    image:
      "/assets/maps/spearhead-trails---ridgeview-atv-trail-map.jpg",
    id: "1687713",
  },
  {
    name: "Stoney Lonesome OHV Park Map",
    slug: "stony-lonesome-ohv-park-map",
    price: "$10.00",
    image: "/assets/maps/stoney-lonesome-ohv-park-map.jpg",
    id: "1684271",
  },
  {
    name: "Top Trails Map",
    slug: "Top-Trails",
    price: "$10.00",
    image: "/assets/maps/top-trails-map.jpg",
    id: "1687699",
  },
  {
    name: "Turkey Bay Off-Highway Vehicle (OHV) Area Map",
    slug: "turkey-bay-off-highway-vehicle-ohv-area-map",
    price: "$10.00",
    image:
      "/assets/maps/turkey-bay-off-highway-vehicle-(ohv)-area-map.jpg",
    id: "1684272",
  },
  {
    name: "Wildcat Adventures Offroad Park Map",
    slug: "wildcat-adventures-off-road-park-map",
    price: "$10.00",
    image:
      "/assets/maps/wildcat-adventures-offroad-park-map.jpg",
    id: "1684263",
  },
  {
    name: "Windrock Park Map",
    slug: "windrock-park-map",
    price: "$12.00",
    image: "/assets/maps/windrock-park-map.jpg",
    id: "1684269",
  },
  {
    name: "Wrights Area 252 Riding Park Map",
    slug: "wrights-area-252-riding-park",
    price: "$10.00",
    image:
      "/assets/maps/wrights-area-252-riding-park-map.jpg",
    id: "1687693",
  },
];

export default function MapsPage() {
  return (
    <div className="bg-white text-gray-900 font-[Quicksand]">
      {/* Hero Section */}
      <section className="bg-white text-center px-4 py-24">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-10 text-green-700">
          BUY A MAP. OWN THE TRAIL.
        </h2>
        <p className="text-lg text-gray-800 max-w-3xl mx-auto leading-relaxed">
          You will receive the file in <strong>.GPX</strong> format. All tracks
          are the color of the original map, labeled with name/number and the
          trail class. The file will need to be imported to a GPS app, visit the{" "}
          <Link to="/how-to" className="text-green-700 underline">
            How To
          </Link>{" "}
          section for more details. This file format can be used with a wide
          array of apps, as long as it supports the file format.
        </p>
        <p className="text-lg text-gray-800 max-w-3xl mx-auto mt-6 leading-relaxed">
          The file was created in <strong>Gaia GPS</strong>. If you import into
          a different app, it may change the colors/waypoint style.
        </p>
      </section>

      {/* Maps Grid */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {maps.map((mapItem) => (
            <div
              key={mapItem.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
            >
              {/* Wrap image + title + price in a Link to the exact slug (capitalization preserved) */}
              <Link to={`/${mapItem.slug}/`} className="block">
                <img
                  src={mapItem.image}
                  alt={mapItem.name}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
                <div className="p-4 text-center">
                  <h2 className="font-semibold text-lg mb-1">{mapItem.name}</h2>
                  <p className="text-green-700 font-bold">{mapItem.price}</p>
                </div>
              </Link>

              {/* Buttons remain outside the Link */}
              <div className="px-4 pb-4 flex justify-center gap-3">
                {/* Add to Cart Button */}
                <form
                  action="https://www.e-junkie.com/ecom/gb.php?c=cart&cl=373197&ejc=2"
                  method="POST"
                >
                  <input type="hidden" name="i" value={mapItem.id} />
                  <button
                    type="submit"
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
                  >
                    Add to Cart
                  </button>
                </form>

                {/* Buy Now Button */}
                <form
                  action="https://www.e-junkie.com/ecom/gb.php?c=cart&cl=373197&ejc=2"
                  method="POST"
                >
                  <input type="hidden" name="i" value={mapItem.id} />
                  <input type="hidden" name="o" value="immediate" />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    Buy Now
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-green-100 text-center">
        <h3 className="text-2xl font-bold mb-4">Don’t Want to Import Files?</h3>
        <a
          href="https://mytrailmapspages.pages.dev/"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open My Trail Maps App
        </a>
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
