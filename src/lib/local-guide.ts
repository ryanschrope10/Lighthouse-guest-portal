// ============================================================
// Per-park "Explore the Area" guide
// ============================================================
//
// Curated, human-checked local attractions for each property
// (multi-tenant: keyed by the property slug). Content is written
// in-house from public information about each town — no scraped
// copy or hotlinked images. Add a park => add an entry here.
//
// `image` is intentionally optional: leave it unset to use the
// colorful category artwork, or point it at a licensed / owned
// photo (e.g. /brands/<slug>/places/foo.jpg) when one exists.
// ============================================================

export type LocalCategoryId = "outdoors" | "food" | "local" | "daytrip";

export interface LocalCategory {
  id: LocalCategoryId;
  label: string;
}

export interface LocalPlace {
  id: string;
  name: string;
  category: LocalCategoryId;
  /** Short, in-house description (1-2 sentences). */
  blurb: string;
  /** Human location hint, e.g. "Downtown Emmett". */
  area: string;
  /** Free-text map query (place + town/state). Opens Google Maps. */
  mapsQuery: string;
  /** Optional licensed/owned photo path; falls back to category art. */
  image?: string;
}

export interface LocalGuide {
  /** Town/region shown in the module header. */
  area: string;
  categories: LocalCategory[];
  places: LocalPlace[];
}

const CATEGORIES: LocalCategory[] = [
  { id: "outdoors", label: "Outdoors" },
  { id: "food", label: "Food & Drink" },
  { id: "local", label: "Local Gems" },
  { id: "daytrip", label: "Day Trips" },
];

// ---- Holiday Motel & RV Park — Emmett, Idaho ----
const EMMETT: LocalGuide = {
  area: "Emmett & the Gem Valley",
  categories: CATEGORIES,
  places: [
    {
      id: "black-canyon-reservoir",
      name: "Black Canyon Reservoir",
      category: "outdoors",
      blurb:
        "A 1,100-acre reservoir with ~12 miles of shoreline — boating, fishing, swimming and kayaking, with day-use parks right on the water.",
      area: "Just north of Emmett",
      mapsQuery: "Black Canyon Reservoir, Emmett, ID",
    },
    {
      id: "pioneers-mountain",
      name: "Pioneer's Mountain Hike",
      category: "outdoors",
      blurb:
        "The valley's landmark butte. A climb up the local trail is rewarded with sweeping panoramic views over the Emmett Valley.",
      area: "Emmett Valley",
      mapsQuery: "Squaw Butte trailhead, Emmett, ID",
    },
    {
      id: "freezeout-overlook",
      name: "Freezeout Hill Overlook",
      category: "outdoors",
      blurb:
        "One of Gem County's most iconic views — the whole valley of orchards and farmland framed by distant mountains. Great at golden hour.",
      area: "Hwy 16, above town",
      mapsQuery: "Freezeout Hill Scenic Overlook, Emmett, ID",
    },
    {
      id: "route-52-drive",
      name: "Route 52 Scenic Drive",
      category: "outdoors",
      blurb:
        "An easy, pretty drive that runs along the north side of Black Canyon Reservoir — a relaxed way to take in the river canyon.",
      area: "Hwy 52 corridor",
      mapsQuery: "Idaho State Highway 52, Emmett, ID",
    },
    {
      id: "cowboys-chophouse",
      name: "Cowboys Chophouse",
      category: "food",
      blurb:
        "Family-owned and operated steakhouse in Historic Downtown Emmett — the go-to for a proper steak dinner in town.",
      area: "Historic Downtown Emmett",
      mapsQuery: "Cowboys Chophouse, Emmett, ID",
    },
    {
      id: "roe-anns",
      name: "Roe Ann's Drive-In",
      category: "food",
      blurb:
        "A classic small-town drive-in and a long-running local favorite for burgers, fries and shakes.",
      area: "Emmett",
      mapsQuery: "Roe Ann's Drive-In, Emmett, ID",
    },
    {
      id: "corner-deli",
      name: "The Corner Deli",
      category: "food",
      blurb:
        "Highly-rated local deli — fresh sandwiches and a friendly, quick lunch stop close to downtown.",
      area: "Downtown Emmett",
      mapsQuery: "The Corner Deli, Emmett, ID",
    },
    {
      id: "happy-teriyaki",
      name: "Happy Teriyaki",
      category: "food",
      blurb:
        "Casual spot for teriyaki bowls, Chinese classics and bubble tea — an easy weeknight dinner.",
      area: "Emmett",
      mapsQuery: "Happy Teriyaki, Emmett, ID",
    },
    {
      id: "williams-fruit-ranch",
      name: "Williams Fruit Ranch",
      category: "local",
      blurb:
        "Beloved local orchard stand known for fresh-pressed apple cider and seasonal cherries, peaches and apples.",
      area: "Emmett orchards",
      mapsQuery: "Williams Fruit Ranch, Emmett, ID",
    },
    {
      id: "gem-county-museum",
      name: "Gem County Historical Museum",
      category: "local",
      blurb:
        "The Historical Society's Village Museum tells Emmett's story — pioneer life, Native American history and the valley's farming roots.",
      area: "Emmett",
      mapsQuery: "Gem County Historical Society Museum, Emmett, ID",
    },
    {
      id: "cherry-festival",
      name: "Emmett Cherry Festival",
      category: "local",
      blurb:
        "The town's signature summer event celebrating the valley's cherry harvest — a fun one to time a stay around (typically June).",
      area: "Downtown Emmett",
      mapsQuery: "Emmett City Park, Emmett, ID",
    },
    {
      id: "firebird-raceway",
      name: "Firebird Raceway",
      category: "daytrip",
      blurb:
        "A well-known Idaho drag strip just minutes from the park — check the schedule for race weekends and events.",
      area: "Near Emmett (Hwy 16)",
      mapsQuery: "Firebird Raceway, Eagle, ID",
    },
    {
      id: "boise",
      name: "Downtown Boise",
      category: "daytrip",
      blurb:
        "Idaho's capital is an easy drive away — the Greenbelt, museums, breweries and dining make for a full day out.",
      area: "~45 min southeast",
      mapsQuery: "Downtown Boise, ID",
    },
    {
      id: "bogus-basin",
      name: "Bogus Basin",
      category: "daytrip",
      blurb:
        "Year-round mountain recreation above Boise — skiing and tubing in winter, mountain biking and the alpine coaster in summer.",
      area: "Mountains above Boise",
      mapsQuery: "Bogus Basin Mountain Recreation Area, Boise, ID",
    },
  ],
};

const GUIDES: Record<string, LocalGuide> = {
  "holiday-motel": EMMETT,
};

/** Local guide for a property slug, or null if none is curated yet. */
export function getLocalGuide(slug: string | undefined): LocalGuide | null {
  if (!slug) return null;
  return GUIDES[slug] ?? null;
}
