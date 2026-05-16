# Week 1 Review — MagnetRock PawCare × Mapsi Integration

**Project:** PawCare London — Interactive Clinic Locator  
**Client:** MagnetRock  
**Developer:** AlgoLayer Technologies (Mapsi Integration Team)  
**Review Date:** Day 5 of 21  
**Preview URL:** *(Vercel preview URL — pushed on Day 5)*  
**Branch:** `foundation`

---

## What Was Built This Week

### Day 1 — Foundation ✅
- Created `foundation` feature branch from `main`
- Built all five static pages: Home, Services, Locations, Booking, About
- Deployed preview environment on Vercel
- Confirmed `NEXT_PUBLIC_MAPSI_API_KEY` is active in Vercel environment

### Day 2 — Interactive Map ✅
**Feature:** `/locations` page now shows a live interactive map

- Replaced the placeholder div with a real Mapsi-powered map
- All 12 PawCare clinic locations are marked with emerald dot markers
- Each marker has a popup: clinic name, address, phone number, opening hours, and a "Get Directions" button
- Map is centred on London at a zoom level that shows all clinics at once
- Clinic data extracted to `data/clinics.json` — this is the file you will edit yourself to update hours, add clinics, or hide a closed clinic

### Day 3 — Search + Nearest Clinics ✅
**Feature:** Users can search by postcode/area and find the 3 nearest clinics

- Search bar geocodes any UK postcode or place name (e.g. "SW1", "Brixton", "Victoria Station") using the Mapsi Geocoding API
- "Use My Location" button uses the browser's GPS to locate the user instantly
- After searching or locating, the top 3 nearest clinics appear in a ranked panel showing distance (metres/km)
- The nearest 3 marker dots on the map turn a brighter shade to highlight them
- User's location appears as a blue dot on the map

### Day 4 — Routing (Get Directions) ✅
**Feature:** Users can get a driving route from their location to any clinic

- Clicking "Get Directions" (either in the nearest-clinics panel or in a clinic popup) draws the route on the map
- Route is drawn as a green line; the map zooms to show the full route
- Works from both the nearest-clinics panel and the full clinic list below
- Note: user must have searched/located themselves first — the feature prompts them if not

---

## How to Test the Preview

Open the preview URL and work through this checklist:

- [ ] Home page loads correctly, all navigation links work
- [ ] Services page lists 6 services with prices
- [ ] **Locations page — map loads** (may take 2–3 seconds on first visit)
- [ ] **Type `SW4` in search bar → press Search** → map moves to Clapham area, nearest 3 clinics appear
- [ ] **Click "Use My Location"** → allow browser location prompt → blue dot appears, nearest 3 update
- [ ] **Click "Get Directions"** on any clinic card → green route line draws on map
- [ ] Click a marker on the map → popup shows clinic info and Get Directions button
- [ ] Booking page form works (submits to alert — backend not connected yet)
- [ ] About page loads, shows demo disclaimer
- [ ] Test on your mobile phone — check map fills the screen, popups are readable

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Leaflet default marker images may not load on some hosts | Low | Resolved — using CSS dot markers instead |
| "Get Directions" prompts user if no location set (no silent failure) | Info | By design |
| Tile loading speed depends on Mapsi free tier (1,000 req/day, 2/sec) | Low | Acceptable for demo |

---

## Decision Required for Week 2

Before Monday, please decide on one item:

**Coverage zone type for home visit checker:**

> **Option A — Fixed Postcode Zones** (Recommended)
> Define Central/Inner/Outer London by postcode prefix (EC, WC, N, SW, etc.).
> - Pros: Simple to explain to customers, instant to calculate, cheap
> - Cons: Less precise than actual drive time

> **Option B — Isochrone Zones (Drive-Time)**
> Use the Mapsi Isochrone API to generate 15/30/45-minute drive zones from each clinic.
> - Pros: Accurate real-world coverage, visually impressive
> - Cons: Requires an API call per user address check, slightly slower

Reply by **Monday morning** with your choice. We will build Week 2 around that decision.

---

## Week 2 Preview

Next week we will build:

1. **Coverage zone polygons** on the map (either fixed or isochrone, based on your decision)
2. **Booking form address autocomplete** — as-you-type suggestions using Mapsi Geocoding
3. **Coverage check** — the booking form will instantly show: "Home visit available — £50 fee" or "Outside coverage area — clinic visit only"
4. **Matrix API** — nearest clinics ranked by actual drive time, not straight-line distance
5. **Mini static map** on the booking confirmation

---

## Communication This Week

| Day | Update |
|-----|--------|
| Day 1 | ✅ Foundation deployed — preview URL shared |
| Day 2 | ✅ Map live — 12 clinic markers visible |
| Day 3 | ✅ Search and nearest clinics working |
| Day 4 | ✅ Get Directions working |
| Day 5 (today) | 📤 This review document + 3-min demo video sent |
| Day 7 (Mon AM) | ⏳ Feedback deadline — please reply with zone decision |

---

*Questions or issues? Reply to this email or message on Slack. Response within 2 hours during business hours.*
