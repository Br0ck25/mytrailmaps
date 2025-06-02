// src/pages/MapDetailPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";

const maps = [
  {
    id: "1735157",
    slug: "Black-Hills-All-Vehicles",
    name: "Black Hills All Vehicles Map",
    price: "$5.00",
    image: "/assets/maps/black-hills-all-vehicles-map.jpg",
    details: {
      description:
        "The Black Hills All Vehicles area sits just outside of Sturgis, SD, and offers over 500 miles of multi-use trails that accommodate ATVs, UTVs, Jeeps, and dirt bikes. Trails wind through ponderosa pines, granite outcroppings, and along pristine creeks. Whether you’re a beginner or an expert, the network has routes ranging from easy scenic loops to challenging rock climbs. Helicopter tours and ridge-line overlooks provide breathtaking views of the surrounding Black Hills National Forest.",
      address: "1600 E Highway 44, Rapid City, SD 57703",
      hours: "Open daily, sunrise to sunset.",
    },
  },
  {
    id: "1684261",
    slug: "black-mountain-off-road-adventure-area-map",
    name: "Black Mountain Offroad Adventure Area Map",
    price: "$10.00",
    image: "/assets/maps/black-mountain-offroad-adventure-area-map.jpg",
    details: {
      description:
        "Black Mountain Off-Road Adventure Area is a 7,000-acre off-road trail system in Harlan County, Kentucky. With over 150 miles of marked trails carved out of former mining roads and logging routes, riders of all skill levels—from beginner-friendly loops to expert rock-crawling sections—will find something to challenge them. The park sits at elevations up to 3,300 feet, offering scenic overlooks and rugged terrain. On-site amenities include two trailheads (Evarts & Putney), cabin and RV camping, a full-service concession stand, and zipline tours.",
      address:
        "Evarts Trailhead: 711 Bailey Creek Rd, Evarts, KY 40828  \nPutney Trailhead: 1912 KY-160, Putney, KY 40865",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1684268",
    slug: "blue-holler-off-road-park-map",
    name: "Blue Holler Offroad Park Map",
    price: "$10.00",
    image: "/assets/maps/blue-holler-offroad-park-map.jpg",
    details: {
      description:
        "Blue Holler Offroad Park is located near Mammoth Cave, Kentucky, on 1,200 acres of mixed-terrain tracks. With roughly 35 miles of marked ATV/UTV trails, “The Holler” features everything from fast wooded loops to technical hill climbs and a famous sand cave that you can ride right through. The park offers primitive camping (no hookups), restroom & shower facilities, and an on-site concession truck serving breakfast, lunch, and dinner. Generators are allowed.",
      address: "1494 Ollie Rd, Mammoth Cave, KY 42259",
      hours:
        "Open Friday 8 am–6 pm, Saturday 8 am–6 pm, Sunday 8 am–6 pm (closed Monday–Thursday).",
    },
  },
  {
    id: "1684264",
    slug: "brimstone-map",
    name: "Brimstone Map",
    price: "$10.00",
    image: "/assets/maps/brimstone-map.jpg",
    details: {
      description:
        "Brimstone Recreation offers over 1,000 acres of offroad terrain just outside Huntsville, TN. Riders can tackle technical rock gardens, wooded loops, and open valley runs. On-site amenities include full hook-up RV sites, cabins, a pavilion, hot showers, and a camp store stocked with fuel and snacks. Weekly events—from mud runs to hill climbs—keep things lively, while beginner-friendly trails make it a great family destination.",
      address: "2860 Baker Hwy, Huntsville, TN 37756",
      hours: "Open Saturday & Sunday 9 am–5 pm (Friday by reservation only).",
    },
  },
  {
    id: "1687694",
    slug: "Bryant-Grove-Trail",
    name: "Bryant Grove Trail Map",
    price: "$2.00",
    image: "/assets/maps/bryant-grove-trail-map.jpg",
    details: {
      description:
        "This flat, winding trail connects the Couchville Lake area to Bryant Grove Recreation Area as it follows the shore of Percy Priest Lake. The path visits several unique habitats, including rare limestone glades. It crosses a wooden bridge above Bryant Grove Creek, where Green Herons are occasionally seen wading and feeding. The one-mile marker (coming from Couchville Lake) is a good “habitat edge” birding spot for warblers, vireos, and other species. Wildflowers along the route include Spider Lily, Shooting Star, Glade Phlox, Rose Verbena, Evening Primrose, Tennessee Milkvetch, and Prickly Pear cactus. Keep an eye out for owls, hawks, and raccoons along the trail.",
      address: "2910 Hobson Pike, Hermitage, TN 37076",
      hours: "Open year-round, dawn to dusk (no fee).",
    },
  },
  {
    id: "1687717",
    slug: "carolina-adventure-world",
    name: "Carolina Adventure World Map",
    price: "$10.00",
    image: "/assets/maps/carolina-adventure-world-map.jpg",
    details: {
      description:
        "Carolina Adventure World is the Southeast’s largest outdoor playground, spanning 2,600 acres with over 120 miles of custom-designed ATV, UTV, and dirt bike trails. The park features multiple mud bogs, a rock-crawl area, and a banked oval track. On-site amenities include a welcome center with rentals and dining at Arrowhead Tavern, a camp store, bathhouses, RV and tent camping with water/electric hookups, cabins, and yurts by the lake. Regular events, including full-moon night rides, live music, and family weekends, make it a destination for off-road enthusiasts of all skill levels.",
      address: "1515 Arrowhead Rd, Winnsboro, SC 29180",
      hours: "Trails open daily 8 am–sunset; park open daily 8 am–11 pm (closed Christmas Day).",
    },
  },
  {
    id: "1687689",
    slug: "dirty-turtle-off-road-park-dtor",
    name: "Dirty Turtle Offroad Park DTOR Map",
    price: "$12.00",
    image: "/assets/maps/dirty-turtle-offroad-park-dtor-map.jpg",
    details: {
      description:
        "Dirty Turtle Offroad PARK is 270 acres of prime offroading land located in Bedford, KY. DTOR is open to anything offroad—Jeeps, Buggies, SxS, RZR, ATV, and more. Our trail system features a wide array of routes to accommodate everyone. Whether you’re new to offroading or have been wheelin’ for years, you’ll find everything you’re looking for in a full day of trail riding at DTOR.",
      address: "93 Bucks Run Rd, Bedford, KY 40006",
      hours: "Open Thursday 12 pm–8 pm, Friday 12 pm–10 pm, Saturday 9 am–10 pm, Sunday 9 am–4 pm (closed Monday–Wednesday).",
    },
  },
  {
    id: "1687700",
    slug: "Flat-Nasty-Off-Road-Park",
    name: "Flat Nasty Offroad Park Map",
    price: "$12.00",
    image: "/assets/maps/flat-nasty-offroad-park-map.jpg",
    details: {
      description:
        "Flat Nasty Offroad Park spans over 850 acres of rugged terrain in the Missouri Ozarks, just off Highway ZZ near Jadwin. The park features a managed trail system for ATVs, UTVs, Jeeps, and dirt bikes, including big rock climbs, deep mud pits, wooded singletrack, and direct access to the Current River for on-water fun. On-site amenities include full-hookup RV sites, primitive tent camping, bathhouses, a camp store, and picnic areas. Signature annual events—such as the Great American Crawl and 20th Anniversary Memorial Weekend—draw off-road enthusiasts from across the Midwest.",
      address: "1775 Hwy ZZ, Jadwin, MO 65501",
      hours: "Open Thursday–Sunday, 8 am–6 pm (closed Monday–Wednesday; extended hours during special events).",
    },
  },
  {
    id: "1687695",
    slug: "Golden-Mountain-Park",
    name: "Golden Mountain Park Map",
    price: "$5.00",
    image: "/assets/maps/golden-mountain-park-map.jpg",
    details: {
      description:
        "Golden Mountain Park is one of the toughest off-road destinations in the Southeast, located on over 500 acres in Sparta, TN. With 45+ trails ranging from Level 1 trail rides to Level 5 technical rock crawls, you’ll find steep hill climbs, mud pits, and challenging rock obstacles. On-site amenities include full-hookup RV sites, primitive campsites, bunkhouses, pavilions, bathhouses, and a camp store. Monthly events—like mud runs, hill-climb competitions, and night rides—attract off-road clubs statewide, while weekday ride openings are available by reservation.",
      address: "6338 Golden Mountain Rd, Sparta, TN 38583",
      hours: "Open Thursday 6 pm–Sunday 6 pm (advance reservations available for other days; closed Monday–Wednesday).",
    },
  },
  {
    id: "1687715",
    slug: "Hatfield-McCoy-Trails-Bearwallow",
    name: "Hatfield McCoy Trails - Bearwallow Map",
    price: "$10.00",
    image: "/assets/maps/hatfield-mccoy-trails---bearwallow-map.jpg",
    details: {
      description:
        "Bearwallow Trail System is one of the original three Hatfield-McCoy Trails, located just outside Logan, WV. With over 35 miles of trails ranging from easy scenic loops overlooking the river valleys to challenging technical routes, Bearwallow offers riding for all skill levels. The trailhead provides direct access to gas, lodging, and restaurants in nearby Logan. Open to ORVs, ATVs, UTVs, and off-road motorcycles, Bearwallow also connects to adjacent systems like Rockhouse and Devil Anse for extended multi-day adventures.",
      address: "247 Bearwallow Drive Ethel, WV 25076",
      hours: "Open daily, 24 hours (permit required).",
    },
  },
  {
    id: "1687716",
    slug: "Hatfield-McCoy-Trails-Warrior",
    name: "Hatfield McCoy Trails - Warrior Map",
    price: "$8.00",
    image: "/assets/maps/hatfield-mccoy-trails---warrior-map.jpg",
    details: {
      description:
        "The Hatfield–McCoy Trails system offers over 700 miles of off-road trails for ATVs, UTVs, dirt bikes, hikers, mountain bikers, and horse riders. Created on reclaimed mining land across southern West Virginia, the trails traverse hardwood forests, river valleys, and ridge-top overlooks. Amenities include trailhead campgrounds, cabin rentals, and nearby lodging at Appalachian Outpost. This network connects multiple trail systems—such as Warrior, Bearwallow, and Rockhouse—providing access to both moderate and expert routes, plus scenic riverside loops.",
      address: "180 Appalachian Outpost Trl, Man, WV 25635",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1687696",
    slug: "Hawk-Pride-Off-Road",
    name: "Hawk Pride Mountain Offroad Map",
    price: "$12.00",
    image: "/assets/maps/hawk-pride-offroad-map.jpg",
    details: {
      description:
        "Hawk Pride Mountain Offroad is a 1,000‐acre private park in Tuscumbia, AL, featuring over 120 rock-crawling trails and miles of ATV/UTV routes through wooded hills and mud pits. Designed for everyone from hardcore rock-buggy enthusiasts to casual trail riders, the park offers technical rock gardens, wooded singletrack, and expansive mud areas. On-site amenities include eight cabin rentals, 13 RV pads with full hookups, a pavilion, bathhouses, and a camp store. Regular weekend events—such as guided rock-crawl clinics and mud runs—keep the park active year-round.",
      address: "589 Hester Porter Road, Tuscumbia, AL 35674",
      hours: "Open Friday 8 am–10 pm, Saturday 8 am–10 pm, Sunday 8 am–5 pm; additional days by reservation.",
    },
  },
  {
    id: "1737436",
    slug: "Hollerwood",
    name: "Hollerwood OffRoad Adventure Park Map",
    price: "$10.00",
    image: "/assets/maps/hollerwood-offroad-adventure-park-map.jpg",
    details: {
      description:
        "Hollerwood OffRoad Adventure Park spans over 2,500 acres of valleys and ridges near Stanton, KY—just a short drive from Red River Gorge. Riders will find a challenging network of ATV/UTV trails featuring steep hill climbs, rock obstacles, deep mud pits, and wooded singletrack. Beginner areas and pro sections exist side-by-side, plus a well-stocked General Store for permits, maps, and gear. On-site amenities include full RV hookups, campgrounds, SxS rentals, and covered pavilions. The park hosts weekend events like mud runs and hill-climb competitions, with guided rides available during office hours.",
      address: "2096 Highway 1036, Stanton, KY 40380",
      hours:
        "Office Hours: Friday – Sunday, 9:00 am–7:00 pm\nPark Hours: Open 24/7 with an active pass",
    },
  },
  {
    id: "1687690",
    slug: "kentucky-adventure-trail",
    name: "Kentucky Adventure Trail Map",
    price: "$5.00",
    image: "/assets/maps/kentucky-adventure-trail-map.jpg",
    details: {
      description:
        "Kentucky Adventure Trail (KAT) is an 8,700-acre OHV system centered around the Daniel Boone National Forest near Hazel, KY. KAT offers more than 200 miles of marked multi-use trails for ATVs and UTVs. Riders can traverse sandstone crests, rock climbs, and lush hardwood hillsides. The trail system is free to use, and popular trailheads include Blackberry, Tarter Pole, and Hell’s Hollow. Primitive camping is available at several trailheads, and nearby towns like Booneville and Manchester provide lodging and dining. KAT is also a favorite for trail-riding charity rides.",
      address: "Daniel Boone National Forest, Hazel, KY 40933",
      hours: "Open year-round, sunrise to sunset (no fee).",
    },
  },
  {
    id: "1792377",
    slug: "Leatherwood-Off-Road-Park",
    name: "Leatherwood Offroad Map",
    price: "$12.00",
    image: "/assets/maps/leatherwood-offroad-map.jpg",
    details: {
      description:
        "Leatherwood Off-Road Park is Kentucky’s largest off-road park, offering over 250 miles of trails across 50,000+ acres of Appalachian terrain. Suitable for ATVs, UTVs, Jeeps, and dirt bikes, trails range from easy, family-friendly loops to technical, adrenaline-pumping rock climbs and wooded singletrack. On-site amenities include a general store for permits, primitive and RV camping, bathhouses, and seasonal guided rides. All off-road vehicles are welcome at this family-friendly destination, and new trail miles are added regularly.",
      address: "11802 KY HWY-699, Leatherwood, KY 41731",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1687691",
    slug: "mine-made-adventure-park",
    name: "Mine Made Adventure Park Map",
    price: "$10.00",
    image: "/assets/maps/mine-made-adventure-park-map.jpg",
    details: {
      description:
        "Mine Made Adventure Park (also known as Mine Made Paradise) is built on over 43,000 acres of reclaimed coal land near Elmrock and Hindman, KY. The park features more than 100 miles of well-marked ATV, UTV, and dirt bike trails that wind through reclaimed mine roads, creek crossings, and scenic ridge-top overlooks. Amenities include full-hookup RV sites, primitive camping, cabins, bathhouses, and a camp store. The Knott County ATV & Streetbike Training Center on-site offers safety courses, while regular events—such as guided trail rides and off-road competitions—ensure year-round excitement for riders of all levels.",
      address: "50 Mine Made Ln, Elmrock, KY 41772",
      hours:
        "Monday–Thursday: 8 am–4 pm\nFriday & Saturday: 8 am–8 pm\nSunday: 8 am–4 pm",
    },
  },
  {
    id: "1687697",
    slug: "Patawomack-Adventure-Park",
    name: "Patawomack Adventure Park Map",
    price: "$8.00",
    image: "/assets/maps/patawomack-adventure-park-map.jpg",
    details: {
      description:
        "Patawomack ATV Adventure in Irvington, AL features numerous mud bogs and pits, wooded trails, a motocross track, and multiple hill climbs. The property includes a 3.5-acre lake reaching depths of up to 6 feet. Camping is allowed anywhere on-site (no electric or water hookups), and all vehicle types are permitted. Weekday riding is available by appointment only.",
      address: "7720 County Farm Road, Irvington, AL 36544",
      hours: "Open Friday 12 pm–dusk; Saturday & Sunday 8 am–dusk (weekdays by appointment).",
    },
  },
  {
    id: "1684267",
    slug: "pickett-state-forest-ohv-trail-map",
    name: "Pickett State Forest OHV Trail Map",
    price: "$10.00",
    image: "/assets/maps/pickett-state-forest-ohv-trail-map.jpg",
    details: {
      description:
        "Pickett State Forest OHV Trails near Jamestown, TN boast over 30 miles of lightly maintained ATV/UTV tracks that wind through mixed hardwood forests and past limestone bluffs. Unlike many private parks, Pickett trails remain free (state-managed) and offer a backcountry feel with minimal signage. Riders frequently spot deer, wild turkey, and unique fern-lined hollows. While no on-site amenities are provided, there is primitive camping at designated sites within the forest. A day-use permit is required and can be purchased at the ranger station.",
      address: "4605 Pickett Park Hwy, Jamestown, TN 38556",
      hours: "Open year-round, sunrise to sunset (day-use permit required).",
    },
  },
  {
    id: "1687692",
    slug: "Redbird-Crest-Trail-System",
    name: "Redbird Crest Trail System Map",
    price: "$5.00",
    image: "/assets/maps/redbird-crest-trail-system-map.jpg",
    details: {
      description:
        "Redbird Crest Trail System is a remote OHV network nestled in the Daniel Boone National Forest near Big Creek, KY. Featuring over 100 miles of rugged singletrack and doubletrack trails, riders will traverse forested ridgelines, canyon switchbacks, and scenic river valleys. Three developed staging areas—Peabody, Sugar Creek, and Bear Creek—offer vault toilets and parking. Because portions cross public roads, motorcycles must be street-legal to access the singletrack sections. Trails range from moderate loops to challenging technical sections, with primitive camping available along the network. An OHV permit is required and can be purchased at the Redbird Ranger District office or local vendors.",
      address: "91 Peabody Rd, Big Creek, KY 40914",
      hours: "Open year-round, sunrise to sunset (OHV permit required).",
    },
  },
  {
    id: "1687706",
    slug: "Rocky-Ridge-Off-Road-Park",
    name: "Rocky Ridge Offroad Park Map",
    price: "$10.00",
    image: "/assets/maps/rocky-ridge-offroad-park-map.jpg",
    details: {
      description:
        "Rocky Ridge Offroad Park spans 150 acres just outside Bowling Green, KY. The park features challenging ATV/UTV trails with technical hill climbs, rock gardens, and narrow spine roads, along with beginner-friendly loops and scenic overlooks. On-site amenities include primitive campsites, porta-johns, and a motocross track for dirt bikes. Group rides, volunteer trail maintenance days, and occasional weekend events foster a strong off-roading community atmosphere. A daily pass or season membership is required for access.",
      address: "3603 Barren River Rd, Bowling Green, KY 42101",
      hours: "Open daily 8 am–dark (weather permitting).",
    },
  },
  {
    id: "1684266",
    slug: "royal-blue-map",
    name: "Royal Blue Map",
    price: "$10.00",
    image: "/assets/maps/royal-blue-map.jpg",
    details: {
      description:
        "Royal Blue Offroad Park is a free, state-managed OHV area in Pioneer, TN. It features approximately 10 miles of easy wooded loops and gentle hillside trails that are ideal for beginners and families. Although there are no restroom facilities or on-site camping, ample parking and a shaded picnic area make it a convenient half-day outing. Wildlife viewing and scenic forest views are common throughout the ride.",
      address: "6307 Stinking Creek Rd, Pioneer, TN 37847",
      hours: "Open year-round, sunrise to sunset (no fee).",
    },
  },
  {
    id: "1684265",
    slug: "rush-offroad-map",
    name: "Rush Offroad Map",
    price: "$10.00",
    image: "/assets/maps/rush-offroad-map.jpg",
    details: {
      description:
        "Rush Off-Road spans 7,000 acres in Rush, KY, featuring over 100 miles of marked ATV/UTV trails that wind through rolling hills, wooded valleys, and scenic ridge tops. Known for its smooth, well-groomed loops alongside technical rock sections and mud pits, the park offers something for every skill level. On-site amenities include primitive and RV camping, covered pavilions, a hot dog shack along the trail, a general store reachable by ride, and bathhouses. Regular events—such as the Anniversary Bash and Rush & Rowdy—draw riders from across the region, while weekday camping and self-guided trail access keep the fun going all week.",
      address: "100 Four Mile Rd, Rush, KY 41168",
      hours:
        "Open daily, 6 am–midnight (park accessible year-round). Office hours: Thu 8 am–6 pm; Fri & Sat 8 am–8 pm; Sun 8 am–5 pm; Closed Mon–Wed.",
    },
  },
  {
    id: "1687701",
    slug: "southern-missouri-off-road-ranch-smorr",
    name: "Southern Missouri Offroad Ranch SMORR Map",
    price: "$12.00",
    image: "/assets/maps/southern-missouri-offroad-ranch-smorr-map.jpg",
    details: {
      description:
        "Southern Missouri Offroad Ranch (SMORR) sits on 3,000 acres just outside Seymour, MO, featuring over 200 miles of marked ATV and UTV trails that wind through oak–hickory forests, sandstone bluffs, and creek crossings. Riders can choose from beginner loops to advanced rock gardens and mud pits. On-site amenities include full-hookup campsites, bathhouses, a general store, and seasonal café service. SMORR hosts events like “Mudfest” and “Ranch Rumble,” drawing riders statewide. Dual-sport motorcycles and dirt bikes are also welcome on designated routes.",
      address: "5722 State Hwy K, Seymour, MO 65746",
      hours:
        "Gate House open Friday–Sunday 8 am–7 pm (closed Monday–Thursday; extended hours during 4-day holiday weekends and special events).",
    },
  },
  {
    id: "1687703",
    slug: "Southington-Off-Road-Park",
    name: "Southington Offroad Park Map",
    price: "$5.00",
    image: "/assets/maps/southington-offroad-park-map.jpg",
    details: {
      description:
        "Southington Offroad Park is located in Garrettsville, Ohio on over 1,500 acres of terrain featuring mud pits, sand dunes, rock obstacles, and wooded trails. As a family-friendly destination, it offers a modern bathhouse, electric campsites, a large pavilion, a cabin with concessions, a playground, and a sand volleyball court. Event weekends showcase mud drags, hill climbs, and guided trail rides for all skill levels.",
      address: "Garrettsville, OH 44231",
      hours: "Open one weekend per month (see event schedule for specific dates) – typically Friday 8 am–10 pm, Saturday 8 am–10 pm, Sunday 8 am–5 pm.",
    },
  },
  {
    id: "1687714",
    slug: "Spearhead-Stone-Mountain",
    name: "Spearhead - Stone Mountain Map",
    price: "$10.00",
    image: "/assets/maps/spearhead---stone-mountain-map.jpg",
    details: {
      description:
        "Stone Mountain Recreation Area is a 34-mile section of Spearhead Trails accessed via Pennington Gap. These trails wind through reclaimed coal-field ridges and valleys, offering mostly blue-rated loops, technical creek crossings, and scenic ridge-top overlooks. Riders will encounter rocky sections, tight switchbacks, and plenty of forested singletrack. On-site amenities at the Pennington Gap trailhead include primitive camping, a pavilion, and restroom facilities. A valid Spearhead permit is required for access.",
      address: "335 Fairground Road, Pennington Gap, VA 24277",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1687709",
    slug: "Spearhead-Trails-Coal-Canyon",
    name: "Spearhead Trails - Coal Canyon Map",
    price: "$10.00",
    image: "/assets/maps/spearhead-trails---coal-canyon-map.jpg",
    details: {
      description:
        "Coal Canyon boasts 127 miles of marked ATV/UTV trails, including two spacious play areas for motocross-style riding. Terrain features a balanced mix of 53% green (easy), 24% blue (intermediate), and 22% black (expert) loops that traverse reclaimed strip-mining ridges and deep creek bottoms. The trailhead offers parking, pit restroom, and direct connections to Ridgeview at County Line for extended multi-day trips.",
      address: "1124 Chipping Sparrow Road, Grundy, VA 24614",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1687710",
    slug: "Spearhead-Trails-Jawbone-and-Coal-Canyon-at-Jewell-Valley",
    name: "Spearhead Trails - Jawbone and Coal Canyon at Jewell Valley Map",
    price: "$10.00",
    image:
      "/assets/maps/spearhead-trails---jawbone-and-coal-canyon-at-jewell-valley-map.jpg",
    details: {
      description:
        "Jawbone offers 100 miles of jeep- and street-legal ATV/UTV trails winding through reclaimed coalfields and high ridges. Four scenic overlooks provide panoramic views, and technical sections include creek crossings and steep grade climbs. This is the only Spearhead area open to street-legal UTVs, connecting directly to Coal Canyon at Jewell Valley for a seamless 120-mile loop. No on-site services beyond vault toilets and primitive campsites.",
      address: "818 Big Creek Road, Richlands, VA 24641",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1687711",
    slug: "Spearhead-Trails-Mountain-View",
    name: "Spearhead Trails - Mountain View Map",
    price: "$10.00",
    image: "/assets/maps/spearhead-trails---mountain-view-map.jpg",
    details: {
      description:
        "Mountain View offers 118 miles of trails (35% green, 15% blue, 35% black, plus 20 miles of single-track) spread across three trailheads in St. Paul and Coeburn. Riders traverse gentle graded forest roads, open meadows, and moderate technical sections suitable for families and novice riders. Amenities at each trailhead include vault toilets, picnic pavilions, and primitive campsites. The area connects easily to adjacent Spearhead sections for extended adventures.",
      address: "St. Paul: 3461 Hidden Acres Road, St. Paul, VA 24283\nCoeburn: 4850 Little Tom Road, Coeburn, VA 24230\nCoeburn (Dan Hall): 13105 Pleasant Road, Coeburn, VA 24230",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1687712",
    slug: "Spearhead-Trails-Original-Pocahontas",
    name: "Spearhead Trails - Original Pocahontas Map",
    price: "$10.00",
    image:
      "/assets/maps/spearhead-trails---original-pocahontas-map.jpg",
    details: {
      description:
        "Original Pocahontas features 94 miles of trails (46% green, 45% blue, 9% black) including 10 miles of single-track weaving through reclaimed coalfields and forested ridges. Two trailheads—Pocahontas and Bluefield—offer vault toilets, primitive campsites, and direct access to a large pavilion and picnic areas. Wide graded roads, scenic overlooks, and moderate rock sections make it an ideal introductory area for new riders, while still providing challenges for experienced enthusiasts.",
      address: "Pocahontas: 210 Railroad Alley, Pocahontas, VA 24635\nBluefield: 132 Miners Park Lane, Bluefield, VA 24605",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1687713",
    slug: "Spearhead-Trails-Ridgeview-ATV-Trail",
    name: "Spearhead Trails - Ridgeview ATV Trail Map",
    price: "$10.00",
    image:
      "/assets/maps/spearhead-trails---ridgeview-atv-trail-map.jpg",
    details: {
      description:
        "Ridgeview encompasses 78 miles of trails (50% green, 33% blue, 16% black) featuring both open loops and technical sections, plus a motocross track at the Haysi staging area. The trail network rides along high ridges with sweeping valley vistas and occasional creek crossings. Thunder Valley Motocross provides an additional bike-only circuit for dirt bikes. Amenities include vault toilets and primitive campsites at each staging area.",
      address: "Trailhead: 849 Kiwanis Park Road, Haysi, VA 24256\nThunder Valley Motocross: 1290 Kiwanis Park Road, Haysi, VA 24256",
      hours: "Open daily, sunrise to sunset (permit required).",
    },
  },
  {
    id: "1684271",
    slug: "stony-lonesome-ohv-park-map",
    name: "Stony Lonesome OHV Park Map",
    price: "$10.00",
    image: "/assets/maps/stoney-lonesome-ohv-park-map.jpg",
    details: {
      description:
        "Stony Lonesome OHV Park spans over 1,473 acres in Cullman County, Alabama, featuring more than 50 miles of designated ATV, UTV, dirt bike, and rock crawler trails. The terrain includes rugged hillside climbs, dense wooded singletrack, and open play areas. On-site amenities offer full-hookup RV sites, primitive tent camping, cabins, a bathhouse, and a pavilion. Riders of all skill levels can enjoy moderate loops as well as challenging rock sections. Special events—such as spring mud runs and fall rally weekends—draw enthusiasts statewide.",
      address: "3800 County Road 3501, Bremen, AL 35033",
      hours: "Open daily, 8 am–dark (weather permitting).",
    },
  },
  {
    id: "1687699",
    slug: "Top-Trails",
    name: "Top Trails Map",
    price: "$10.00",
    image: "/assets/maps/top-trails-map.jpg",
    details: {
      description:
        "Top Trails Outdoor Park spans 2,800 acres in Talladega County, AL, offering over 100 miles of marked OHV trails, including a 12-mile single-track loop. Trails range from beginner-friendly loops to expert-level rock gardens and mud pits. The park features full-hookup RV sites, primitive camping, cabin rentals, a modern bathhouse, and an on-site environmental center. Special events—such as Poker Runs, MudFest weekends, hill climbs, and live concerts—draw riders throughout the year. A technical 12-mile single-track trail is available for dirt bikes, while the Kiddie Track provides a safe learning area for younger riders.",
      address: "550 Welch Ave, Talladega, AL 35160",
      hours:
        "Wednesday: 8 am – 10 pm\nThursday: 8 am – all night\nFriday: open 24 hours\nSaturday: open 24 hours\nSunday: close at 5 pm",
    },
  },
  {
    id: "1684272",
    slug: "turkey-bay-off-highway-vehicle-ohv-area-map",
    name: "Turkey Bay Off-Highway Vehicle (OHV) Area Map",
    price: "$10.00",
    image:
      "/assets/maps/turkey-bay-off-highway-vehicle-(ohv)-area-map.jpg",
    details: {
      description:
        "Turkey Bay OHV Area is a 2,500-acre off-highway vehicle playground within Land Between the Lakes, featuring approximately 100 miles of primary, secondary, and tertiary trails for ATVs, OHVs, Jeeps, and dirt bikes. Primary trails (yellow blaze) offer smoother, beginner-friendly routes, while secondary (orange blaze) and tertiary (blue blaze) trails introduce more challenging terrain. A dedicated youth trail (‘Turkey Trot’) provides a safe, one-way learning loop for riders 16 and under. Primitive campsites are available by self-registration, with chemical toilets, drinking water, and generator areas on site. Permits (1–3 day or annual) are required and can be purchased at the Gatehouse or Golden Pond Visitor Center.",
      address: "Land Between the Lakes National Recreation Area, Grand Rivers, KY 42045",
      hours: "Open daily from sunrise to sunset (permit required).",
    },
  },
  {
    id: "1684263",
    slug: "wildcat-adventures-off-road-park-map",
    name: "Wildcat Adventures Offroad Park Map",
    price: "$10.00",
    image: "/assets/maps/wildcat-adventures-offroad-park-map.jpg",
    details: {
      description:
        "Wildcat Offroad Park offers over 140 miles of trails on 2,000 acres in East Bernstadt, KY—just 2 miles off I-75 (Exit 49). Riders of all skill levels can enjoy a mix of smooth green loops, challenging blue and black-rated terrain, and technical rock gardens. The park features a general store with snacks and trail maps, 42 full-hookup RV sites, primitive camping areas, and cabins. Trails are open 24/7, and daily riding passes (Adult $20, Youth $13) or annual passes are available. After-hours check-in and midnight-to-midnight riding ensure maximum flexibility for guests.",
      address: "7800 U.S. 25 East, East Bernstadt, KY 40729",
      hours:
        "Office Hours: Monday–Thursday 9 am–5 pm; Friday–Sunday 8 am–5 pm (closed Christmas Day)\nRiding Hours: Open daily 24 hours",
    },
  },
  {
    id: "1684269",
    slug: "windrock-park-map",
    name: "Windrock Park Map",
    price: "$12.00",
    image: "/assets/maps/windrock-park-map.jpg",
    details: {
      description:
        "Windrock Park spans 73,000 acres across four East Tennessee counties and features over 300 miles of ATV, UTV, dirt bike, Jeep, and mountain bike trails. Trails range from easy gravel roads to extreme rock-crawling and steep downhill runs, with scenic overlooks of the Cumberland Plateau. On-site amenities include a full-service campground with 42 RV sites and 75 primitive sites, cabins, bathhouses, a General Store with permit sales and rentals, multiple restaurants, and a pro shop. The trail system is open 24/7 year-round, and the park hosts events such as full-moon rides, jeep jamborees, and motocross races.",
      address: "921 Windrock Road, Oliver Springs, TN 37840",
      hours:
        "Trails: Open 24/7, year-round\nOffice/General Store: Monday–Thursday 9 am–5 pm; Friday 9 am–9 pm; Saturday 8 am–9 pm; Sunday 8 am–5 pm",
    },
  },
  {
    id: "1687693",
    slug: "wrights-area-252-riding-park",
    name: "Wrights Area 252 Riding Park Map",
    price: "$10.00",
    image:
      "/assets/maps/wrights-area-252-riding-park-map.jpg",
    details: {
      description:
        "Wright’s Area 252 Riding Park offers over 12 miles of free offroad trails alongside the Carlisle County River Trails in western Kentucky. Riders can enjoy a mix of ATV and UTV routes through forests and river bottoms. The on-site Trading Post provides permits, snacks, and riding gear. While trail access is free, county permits can be purchased at the Trading Post for $15. A strong local riding community hosts regular group rides and maintenance days, ensuring trails remain well-groomed and engaging for all skill levels.",
      address: "378 County Road 1219, Bardwell, KY 42023",
      hours: "Trails open 24/7; Trading Post hours vary by season (see website or Facebook for current schedule).",
    },
  },
];

export default function MapDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const selectedMap = maps.find((m) => m.slug === slug);

  if (!selectedMap) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Map Not Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-green-700 hover:underline"
        >
          Back to Maps
        </button>
      </div>
    );
  }

  const { name, image, price, details } = selectedMap;
  const { description, address, hours } = details;

  return (
    <div className="bg-white text-gray-900 font-[Quicksand]">
      {/* NavBar is rendered by App.jsx */}
      
      {/* Large Map Display */}
      <section className="max-w-4xl mx-auto my-16 px-4">
        <img
          src={image}
          alt={name}
          className="w-full h-auto rounded-lg shadow-lg"
        />
      </section>

      {/* Details + Purchase Section */}
      <section className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        {/* Left column: Title + Tagline + Description + Standard Note + Address + Hours */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{name}</h1>
          {/* New Tagline */}
          <p className="text-green-700 font-semibold mb-6">
            Find your next adventure today
          </p>

          {/* Park-specific description */}
          <p className="text-gray-800 leading-relaxed mb-6">{description}</p>

          {/* Standard GPX note appended to every description */}
          <p className="text-gray-800 leading-relaxed mb-6">
            You will receive the file in <strong>.GPX</strong> format. All tracks
            are the color of the original map, labeled with name/number and the
            trail class. This file format can be used with a wide array of apps,
            as long as it supports the file format.
          </p>
          <p className="text-gray-800 leading-relaxed mb-6">
            The file was created in <strong>Gaia GPS</strong>, if you import into a
            different app it may change the colors/waypoint style.
          </p>

          {address && (
            <p className="text-gray-700 mb-2">
              <strong>Address:</strong> {address}
            </p>
          )}
          {hours && (
            <p className="text-gray-700 mb-6">
              <strong>Hours:</strong> {hours}
            </p>
          )}
          <button
            onClick={() => navigate(-1)}
            className="text-green-700 hover:underline"
          >
            Back to Maps
          </button>
        </div>

        {/* Right column: Price + GPX Download Icon + E-Junkie Buttons */}
        <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-2 text-sm flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M4.5 3A1.5 1.5 0 003 4.5V7h2V4.5a.5.5 0 01.5-.5h3v-2h-3z" />
              <path
                fillRule="evenodd"
                d="M5 8.5A2.5 2.5 0 017.5 6h5A2.5 2.5 0 0115 8.5v5a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 015 13.5v-5zM7.5 7A1.5 1.5 0 006 8.5v5A1.5 1.5 0 007.5 15h5a1.5 1.5 0 001.5-1.5v-5A1.5 1.5 0 0012.5 7h-5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-500 text-sm">GPX Download</span>
          </p>
          <p className="text-2xl font-bold text-gray-800 mb-6">
            USD {price.replace("$", "")}
          </p>

          {/* Add to Cart Button (styled like Maps page) */}
          <form
            action="https://www.e-junkie.com/ecom/gb.php?c=cart&cl=373197&ejc=2"
            method="POST"
            className="w-full mb-4"
          >
            <input type="hidden" name="i" value={selectedMap.id} />
            <button
              type="submit"
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Add to Cart
            </button>
          </form>

          {/* Buy Now Button (styled like Maps page) */}
          <form
            action="https://www.e-junkie.com/ecom/gb.php?c=cart&cl=373197&ejc=2"
            method="POST"
            className="w-full"
          >
            <input type="hidden" name="i" value={selectedMap.id} />
            <input type="hidden" name="o" value="immediate" />
            <button
              type="submit"
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Buy Now
            </button>
          </form>
        </div>
      </section>

      {/* CTA Section: Link to My Trail Maps App */}
      <section className="py-12 bg-green-100 text-center">
        <h3 className="text-2xl font-bold mb-4">Prefer the App Experience?</h3>
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
      <footer className="bg-gray-800 text-white text-sm py-6 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          &copy; 2025 My Trail Maps. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
