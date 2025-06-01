import React from "react";

const maps = [
  {
    name: "Black Hills All Vehicles",
    price: "$5.00",
    image: "/assets/maps/black-hills-all-vehicles.jpg",
    ejunkie: "https://www.e-junkie.com/product/1735157/Black-Hills-All-Vehicles"
  },
  {
    name: "Black Mountain Offroad Adventure Area",
    price: "$10.00",
    image: "/assets/maps/black-mountain-off-road-adventure-area.jpg",
    id: "1684261"
  },
  {
    name: "Blue Holler Offroad Park",
    price: "$10.00",
    image: "/assets/maps/blue-holler-offroad-park.jpg",
    ejunkie: "https://www.e-junkie.com/product/1684268/Blue-Holler-Off-Road-Park-Map"
  },
  {
    name: "Brimstone Map",
    price: "$10.00",
    image: "/assets/maps/brimstone.jpg",
    ejunkie: "https://www.e-junkie.com/product/1684264/Brimstone-Map"
  },
  {
    name: "Bryant Grove Trail",
    price: "$2.00",
    image: "/assets/maps/bryant-grove-trail.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687694/Bryant-Grove-Trail"
  },
  {
    name: "Flat Nasty Off-Road Park",
    price: "$12.00",
    image: "/assets/maps/flat-nasty-off-road-park.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687700/Flat-Nasty-Off-Road-Park"
  },
  {
    name: "Golden Mountain Park",
    price: "$10.00",
    image: "/assets/maps/golden-mountain-park.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687695/Golden-Mountain-Park"
  },
  {
    name: "Hawk Pride Off-Road",
    price: "$12.00",
    image: "/assets/maps/hawk-pride-off-road.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687696/Hawk-Pride-Off-Road"
  },
  {
    name: "Hatfield McCoy Trails - Bearwallow",
    price: "$10.00",
    image: "/assets/maps/hatfield-mccoy-trails-bearwallow.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687715/Hatfield-McCoy-Trails---Bearwallow"
  },
  {
    name: "Hatfield McCoy Trails - Warrior",
    price: "$8.00",
    image: "/assets/maps/hatfield-mccoy-trails-warrior.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687716/Hatfield-McCoy-Trails---Warrior"
  },
  {
    name: "Kentucky Adventure Trail",
    price: "$5.00",
    image: "/assets/maps/kentucky-adventure-trail.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687690/Kentucky-Adventure-Trail"
  },
  {
    name: "Patawomack Adventure Park",
    price: "$8.00",
    image: "/assets/maps/patawomack-adventure-park.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687697/Patawomack-Adventure-Park"
  },
  {
    name: "Pickett State Forest OHV Trail Map",
    price: "$10.00",
    image: "/assets/maps/pickett-state-forest-ohv-trail-map.jpg",
    ejunkie: "https://www.e-junkie.com/product/1684267/Pickett-State-Forest-OHV-Trail-Map"
  },
  {
    name: "Redbird Crest Trail System",
    price: "$5.00",
    image: "/assets/maps/redbird-crest-trail-system.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687692/Redbird-Crest-Trail-System"
  },
  {
    name: "Rush Off-Road Map",
    price: "$10.00",
    image: "/assets/maps/rush-off-road-map.jpg",
    ejunkie: "https://www.e-junkie.com/product/1684265/Rush-Off-Road-Map"
  },
  {
    name: "Spearhead Trails - Coal Canyon",
    price: "$10.00",
    image: "/assets/maps/spearhead-trails-coal-canyon.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687709/Spearhead-Trails---Coal-Canyon"
  },
  {
    name: "Spearhead Trails - Jawbone and Coal Canyon at Jewell Valley",
    price: "$10.00",
    image: "/assets/maps/spearhead-trails-jawbone-and-coal-canyon-at-jewell-valley.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687710/Spearhead-Trails---Jawbone-and-Coal-Canyon-at-Jewell-Valley"
  },
  {
    name: "Spearhead Trails - Mountain View",
    price: "$10.00",
    image: "/assets/maps/spearhead-trails-mountain-view.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687711/Spearhead-Trails---Mountain-View"
  },
  {
    name: "Spearhead Trails - Original Pocahontas",
    price: "$10.00",
    image: "/assets/maps/spearhead-trails-original-pocahontas.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687712/Spearhead-Trails---Original-Pocahontas"
  },
  {
    name: "Spearhead Trails - Ridgeview ATV Trail",
    price: "$10.00",
    image: "/assets/maps/spearhead-trails-ridgeview-atv-trail.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687713/Spearhead-Trails---Ridgeview-ATV-Trail"
  },
  {
    name: "Stony Lonesome OHV Park Map",
    price: "$10.00",
    image: "/assets/maps/stony-lonesome-ohv-park-map.jpg",
    ejunkie: "https://www.e-junkie.com/product/1684271/Stony-Lonesome-OHV-Park-Map"
  },
  {
    name: "Top Trails",
    price: "$10.00",
    image: "/assets/maps/top-trails.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687699/Top-Trails"
  },
  {
    name: "Turkey Bay Off-Highway Vehicle (OHV) Area Map",
    price: "$10.00",
    image: "/assets/maps/turkey-bay-off-highway-vehicle-ohv-area-map.jpg",
    ejunkie: "https://www.e-junkie.com/product/1684270/Turkey-Bay-Off-Highway-Vehicle-28OHV29-Area-Map"
  },
  {
    name: "Wildcat Adventures Offroad Park Map",
    price: "$10.00",
    image: "/assets/maps/wildcat-adventures-offroad-park-map.jpg",
    ejunkie: "https://www.e-junkie.com/product/1684263/Wildcat-Adventures-Off-Road-Park-Map"
  },
  {
    name: "Windrock Park Map",
    price: "$12.00",
    image: "/assets/maps/windrock-park-map.jpg",
    ejunkie: "https://www.e-junkie.com/product/1684269/Windrock-Park-Map"
  },
  {
    name: "Wright’s Area 252 Riding Park",
    price: "$10.00",
    image: "/assets/maps/wrights-area-252-riding-park.jpg",
    ejunkie: "https://www.e-junkie.com/product/1687693/Wright26230393Bs-Area-252-Riding-Park"
  }
]
;

export default function MapsPage() {
  return (
    <div className="bg-white text-gray-900 font-[Quicksand]">
      {/* Header */}
      <header className="bg-white text-gray-900 p-6 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="My Trail Maps Logo" className="w-12 h-12" />
            <h1 className="text-2xl font-bold">My Trail Maps</h1>
          </div>
          <nav className="space-x-6 text-lg font-medium">
            <a href="/" className="hover:text-green-600">Home</a>
            <a href="/maps/" className="text-green-600">Maps</a>
            <a href="/gps-apps/" className="hover:text-green-600">GPS Apps</a>
            <a href="/how-to/" className="hover:text-green-600">How To</a>
            <a href="/offroad-parks/" className="hover:text-green-600">Offroad Parks</a>
            <a href="/products/" className="hover:text-green-600">Products</a>
            <a href="/offroad-blog/" className="hover:text-green-600">Offroad Blog</a>
            <a href="/about/" className="hover:text-green-600">About</a>
            <a href="/more/" className="hover:text-green-600">More</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      {/* Hero */}
<section className="bg-white text-center px-4 py-24">
  <h2 className="text-5xl md:text-6xl font-extrabold mb-10 text-green-700">
    BUY A MAP. OWN THE TRAIL.
  </h2>
  <p className="text-lg text-gray-800 max-w-3xl mx-auto leading-relaxed">
    You will receive the file in <strong>.GPX</strong> format. All tracks are the color of the original map,
    labeled with name/number and the trail class. The file will need to be imported to a GPS app,
    visit the <a className="text-green-700 underline" href="/how-to/">How To</a> section for more details.
    This file format can be used with a wide array of apps, as long as it supports the file format.
  </p>
  <p className="text-lg text-gray-800 max-w-3xl mx-auto mt-6 leading-relaxed">
    The file was created in <strong>Gaia GPS</strong>. If you import into a different app, it may change the
    colors/waypoint style.
  </p>
</section>


      {/* Maps Grid */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {maps.map((map, index) => (
            <div key={index} className="bg-white rounded-xl shadow hover:shadow-lg transition">
              <img
                src={map.image}
                alt={map.name}
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-4 text-center">
  <h2 className="font-semibold text-lg">{map.name}</h2>
  <p className="text-green-700 font-bold mt-2 mb-3">{map.price}</p>

  <div className="flex justify-center gap-3">
  {/* Add to Cart Button */}
  <form
    action="https://www.e-junkie.com/ecom/gb.php?c=cart&cl=373197&ejc=2"
    method="POST"
  >
    <input type="hidden" name="i" value={map.id} />
    <button
      type="submit"
      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
    >
      Add to Cart
    </button>
  </form>

  {/* Buy Now Button */}
  <form
    action="https://www.e-junkie.com/ecom/gb.php?c=cart&cl=373197&ejc=2"
    method="POST"
  >
    <input type="hidden" name="i" value={map.id} />
    <input type="hidden" name="o" value="immediate" />
    <button
      type="submit"
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Buy Now
    </button>
  </form>
</div>

</div>

            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-green-100 text-center">
        <h3 className="text-2xl font-bold mb-4">Don’t Want to Import Files?</h3>
        <a
          href="https://mytrailmapspages.pages.dev/"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition"
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
