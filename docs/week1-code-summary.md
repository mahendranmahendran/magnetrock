# Week 1 — Files Created & What They Do

**Branch:** `week1`  
**Commit:** `229e5eb`  
**Project:** MagnetRock PawCare × Mapsi Integration  

---

## New Files Created

---

### `data/clinics.json`

**Purpose:** Single source of truth for all clinic location data. The client edits this file directly (after training) to update hours, add clinics, or hide a closed location.

**Pseudocode:**
```
Array of 12 clinic objects, each containing:
  id          → unique number (1–12)
  name        → display name, e.g. "PawCare Camden"
  address     → full UK postal address
  phone       → UK phone number
  hours       → opening hours string or "24/7 Emergency"
  lat, lng    → GPS coordinates for placing the map marker
  status      → "active" (shown on map) or "closed" (hidden)
```

**How it's used:** Both the locations page and the map component read from this file. To hide a clinic, the client changes `"status": "active"` → `"status": "closed"`.

---

### `components/ClinicMap.tsx`

**Purpose:** The interactive map component. Renders a Leaflet.js map with Mapsi tiles, clinic markers, user location dot, highlighted nearest-clinic markers, and a route line.

**Pseudocode:**
```
PROPS ACCEPTED:
  clinics       → array of clinic objects to place on the map
  userLocation  → [lat, lng] of the user (optional)
  highlightIds  → list of clinic IDs to show in a brighter colour
  routeGeoJSON  → route shape from Mapsi Routing API (optional)
  onGetDirections → callback when user clicks "Get Directions" in a popup

ON FIRST RENDER (runs once, browser only):
  load Leaflet library dynamically (avoids server-side crash)
  create map centred on London at zoom 11
  add Mapsi tile layer:
    URL → https://api.mapsi.dev/v1/tiles/{z}/{x}/{y}.png?key=MAPSI_API_KEY
  for each active clinic:
    create a green dot marker at [clinic.lat, clinic.lng]
    attach a popup containing:
      clinic name, address, phone, hours
      "Get Directions" button (fires a custom browser event)
    add marker to map

WHEN highlightIds CHANGES:
  for each clinic marker:
    if clinic.id is in highlightIds → set marker to bright emerald colour
    else → set marker to standard green

WHEN userLocation CHANGES:
  remove old user marker (if any)
  place a blue dot marker at userLocation
  smoothly pan the map to centre on userLocation at zoom 13

WHEN routeGeoJSON CHANGES:
  remove old route line (if any)
  draw the new route as a thick green polyline on the map
  zoom the map to fit the full route within the viewport

ON UNMOUNT:
  destroy the map and free memory

OUTPUT:
  A 500px-tall div that Leaflet uses as its map canvas
```

---

### `app/locations/page.tsx` *(updated)*

**Purpose:** The `/locations` page. Manages all state (search query, user location, nearest clinics, active route) and passes it down to the map and UI panels.

**Pseudocode:**
```
STATE:
  searchQuery    → text in the search input
  userLocation   → [lat, lng] once the user is located
  nearest        → top-3 closest clinics (sorted by distance)
  routeGeoJSON   → route data from the directions API
  routingClinic  → name of clinic currently fetching directions for

LOAD CLINICS:
  import clinics from data/clinics.json
  filter to status === "active" only

FUNCTION computeNearest(lat, lng):
  for each clinic, calculate haversineKm(userLat, userLng, clinic.lat, clinic.lng)
  sort clinics by distance ascending
  keep top 3
  save to nearest state

FUNCTION handleSearch (form submit):
  call GET /api/geocode?q=searchQuery
  get first result's lat/lon
  set userLocation to [lat, lon]
  call computeNearest(lat, lon)

FUNCTION handleUseMyLocation (button click):
  ask browser for GPS coordinates
  on success → set userLocation, call computeNearest
  on failure → show error message

FUNCTION handleGetDirections (clinic):
  if no userLocation → show error "search your address first"
  call GET /api/directions?origin=userLocation&dest=clinic
  receive GeoJSON route shape
  save to routeGeoJSON (map will draw it automatically)

RENDER:
  <Header />
  search bar (calls handleSearch on submit)
  "Use My Location" button (calls handleUseMyLocation)
  IF nearest is not empty:
    nearest-clinics panel (3 cards ranked by distance)
    each card has Directions button + Book link
  <ClinicMap
    clinics=allClinics
    userLocation=userLocation
    highlightIds=nearest clinic IDs
    routeGeoJSON=routeGeoJSON
    onGetDirections=handleGetDirections
  />
  full clinic list grid (all 12 clinics)
  <Footer />
```

---

### `app/api/geocode/route.ts`

**Purpose:** Server-side API route that proxies address searches to the Mapsi Geocoding API. The client never sends the API key — it lives only on the server.

**Pseudocode:**
```
ENDPOINT: GET /api/geocode?q={address}

READ:
  q → the address or postcode to search (from URL query param)
  MAPSI_API_KEY → from server environment variable

VALIDATE:
  if q is missing → return 400 Bad Request
  if API key not set → return 500 Server Error

CALL MAPSI:
  fetch https://api.mapsi.dev/v1/geocode/search?q={q}&limit=5
  with header: X-API-Key: MAPSI_API_KEY

RETURN:
  if Mapsi responds OK → return its JSON to the client
  if Mapsi fails → return error with Mapsi's status code

RESULT SHAPE (example):
  { results: [ { lat: 51.539, lon: -0.142, display_name: "Camden, London" }, ... ] }
```

---

### `app/api/directions/route.ts`

**Purpose:** Server-side API route that proxies routing requests to the Mapsi Routing API. Returns a GeoJSON route shape the map can draw.

**Pseudocode:**
```
ENDPOINT: GET /api/directions?origin_lat=&origin_lng=&dest_lat=&dest_lng=

READ:
  origin_lat, origin_lng → user's location
  dest_lat, dest_lng     → chosen clinic's location
  MAPSI_API_KEY          → from server environment variable

VALIDATE:
  if any coordinate is missing → return 400 Bad Request
  if API key not set → return 500 Server Error

FORMAT POINTS:
  points = "origin_lat,origin_lng|dest_lat,dest_lng"

CALL MAPSI:
  fetch https://api.mapsi.dev/v1/route?points={points}&overview=full
  with header: X-API-Key: MAPSI_API_KEY

RETURN:
  if Mapsi responds OK → return its JSON (contains GeoJSON route geometry)
  if Mapsi fails → return error with Mapsi's status code

RESULT SHAPE:
  GeoJSON FeatureCollection or route object with path geometry
  → ClinicMap draws this as a green polyline on the map
```

---

### `lib/haversine.ts`

**Purpose:** Calculates the straight-line distance between two GPS coordinates using the Haversine formula. Used to rank clinics from nearest to furthest.

**Pseudocode:**
```
FUNCTION haversineKm(lat1, lng1, lat2, lng2) → distance in km:

  CONVERT degrees to radians:
    dLat = (lat2 - lat1) in radians
    dLng = (lng2 - lng1) in radians

  APPLY Haversine formula:
    a = sin²(dLat/2) + cos(lat1) × cos(lat2) × sin²(dLng/2)
    c = 2 × atan2(√a, √(1−a))
    distance = Earth_radius_km × c   (Earth radius = 6,371 km)

  RETURN distance

EXAMPLE:
  haversineKm(51.5092, -0.1278, 51.5392, -0.1426)
  → approximately 3.4 km  (Central London → Camden)
```

---

### `docs/week1-review.md`

**Purpose:** The client-facing end-of-week review document sent to MagnetRock on Day 5. Summarises what was built, provides a test checklist, lists known issues, and requests a decision on the Week 2 zone type.

**Contents:**
```
- What was built each day (Days 1–4) with plain-English feature descriptions
- Preview URL (to be filled in)
- Numbered test checklist for the client to work through
- Known issues table (severity + resolution status)
- Decision required: Fixed postcode zones vs Isochrone (drive-time) zones
  → client must reply by Monday morning
- Week 2 preview (what's coming next)
- Communication log (daily status per day)
```

---

### `docs/INTEGRATION_PLAYBOOK.md`

**Purpose:** A generic, reusable template for onboarding real Mapsi integration clients. Replace every `[PLACEHOLDER]` with the real client's details. Used by AlgoLayer Technologies as a standard project tracker.

**Contents:**
```
Project overview table (client, domain, dates, pricing, Mapsi plan)

Clear Wall table:
  Two columns — what the client does vs what the developer does
  Rule: client decides WHAT and WHEN, developer decides HOW

Phase 1 — Pre-project setup:
  Contract, kickoff call, Vercel access, GitHub access, data file, API key
  Each row: client action | developer action | deliverable | day

Phase 2 — Week 1 (core map features):
  Foundation, map display, search, nearest locations, routing, review
  Status column (⬜ / ✅) to track progress

Phase 3 — Week 2 (advanced features):
  Coverage zones, booking autocomplete, coverage check, Matrix API, performance

Phase 4 — Week 3 (testing & launch):
  Functional testing, Lighthouse audit, UAT, bug fixes, DNS config, soft launch, go-live

Phase 5 — Handoff:
  Admin training, documentation, Mapsi account transfer, final payment, support period

Ongoing responsibilities:
  Who updates data files, who pays API bills, how to handle feature requests

Decision points table:
  6 decisions the client must make, when, options, and impact

Communication protocol:
  Every scenario (bug reports, scope changes, UAT, launch approval) with response times

What client cannot do (and why)
What client can do after training (with how)
```

---

## Modified Files

### `.gitignore`
Added whitelist entries for the four new directories created this week:
```
Before: only app/** and public/** were tracked by git
After:  also tracks components/**, data/**, lib/**, docs/**
```

### `app/globals.css`
Added Leaflet CSS so map controls, popups, and tile layer render correctly:
```
Before: @import "tailwindcss" only
After:  @import "tailwindcss"
        @import "leaflet/dist/leaflet.css"
```

### `package.json`
Added map library:
```
Before: next, react, react-dom only
After:  + leaflet (map rendering)
        + @types/leaflet (TypeScript types)
```

---

## Architecture Summary

```
Browser (client)
  │
  ├── /locations page (app/locations/page.tsx)
  │     │  reads clinics from data/clinics.json
  │     │  manages state: userLocation, nearest, routeGeoJSON
  │     │
  │     ├── Search form
  │     │     └── calls /api/geocode → Mapsi Geocoding API
  │     │
  │     ├── "Use My Location" button
  │     │     └── browser geolocation API
  │     │
  │     ├── Nearest Clinics panel
  │     │     └── computed by lib/haversine.ts
  │     │
  │     └── <ClinicMap /> (components/ClinicMap.tsx)
  │           ├── Leaflet map + Mapsi tile layer
  │           ├── 12 clinic markers (from props)
  │           ├── blue user location dot (from props)
  │           ├── highlighted nearest-3 markers (from props)
  │           └── green route polyline (from props)
  │
  ├── /api/geocode (app/api/geocode/route.ts)  [server-side]
  │     └── proxies to https://api.mapsi.dev/v1/geocode/search
  │           with X-API-Key header (key never exposed to browser)
  │
  └── /api/directions (app/api/directions/route.ts)  [server-side]
        └── proxies to https://api.mapsi.dev/v1/route
              with X-API-Key header (key never exposed to browser)
```
