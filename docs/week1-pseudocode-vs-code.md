# Week 1 — Pseudocode vs React Code

Side-by-side reference for learning. Each row maps one concept from the pseudocode to the real code that implements it.

> Skipped: `data/clinics.json` (plain data), `.gitignore`, `globals.css`, `package.json` — no React concepts there.

---

<table>
<thead>
<tr>
<th width="18%">File</th>
<th width="35%">Pseudocode</th>
<th width="47%">React / TypeScript Code</th>
</tr>
</thead>
<tbody>

<!-- ─────────────────────────────────────── haversine.ts ─── -->

<tr>
<td><code>lib/haversine.ts</code></td>
<td>

```
FUNCTION haversineKm(lat1, lng1, lat2, lng2):
  dLat = (lat2 - lat1) in radians
  dLng = (lng2 - lng1) in radians
  a = sin²(dLat/2) + cos(lat1)
      × cos(lat2) × sin²(dLng/2)
  c = 2 × atan2(√a, √(1−a))
  RETURN Earth_radius_km × c
```

</td>
<td>

```ts
const R = 6371; // km

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(
    Math.sqrt(a), Math.sqrt(1 - a)
  );
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
```

**React concept:** Pure TypeScript utility — no React here. Exported and imported wherever distance is needed.

</td>
</tr>

<!-- ─────────────────────────────────────── ClinicMap — Props ─── -->

<tr>
<td><code>components/ClinicMap.tsx</code><br><br>Props definition</td>
<td>

```
PROPS ACCEPTED:
  clinics       → array of clinic objects
  userLocation  → [lat, lng] (optional)
  highlightIds  → clinic IDs to highlight
  routeGeoJSON  → route shape (optional)
  onGetDirections → callback function
```

</td>
<td>

```tsx
type Props = {
  clinics: Clinic[];
  userLocation?: [number, number] | null;
  highlightIds?: number[];
  routeGeoJSON?: object | null;
  onGetDirections?: (clinic: Clinic) => void;
};

export default function ClinicMap({
  clinics,
  userLocation,
  highlightIds = [],
  routeGeoJSON,
  onGetDirections,
}: Props) { ... }
```

**React concept:** Typing props with TypeScript. `?` marks optional props. Default values go in the destructure (`highlightIds = []`).

</td>
</tr>

<!-- ─────────────────────────────────────── ClinicMap — useRef ─── -->

<tr>
<td><code>components/ClinicMap.tsx</code><br><br>Storing map instance across renders</td>
<td>

```
INTERNAL REFS (persist across renders,
               don't trigger re-render):
  map instance
  array of clinic markers
  user location marker
  flag: route layer ready?
```

</td>
<td>

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const mapRef       = useRef<MaplibreMap | null>(null);
const clinicMarkersRef = useRef<MarkerEntry[]>([]);
const userMarkerRef    = useRef<MaplibreMarker | null>(null);
const routeReadyRef    = useRef(false);
```

**React concept:** `useRef` stores a mutable value that survives re-renders without causing them. Perfect for DOM nodes and third-party library instances like a map object.

</td>
</tr>

<!-- ─────────────────────────────────────── ClinicMap — init map ─── -->

<tr>
<td><code>components/ClinicMap.tsx</code><br><br>Map initialisation (runs once on mount)</td>
<td>

```
ON FIRST RENDER (runs once, browser only):
  load map library dynamically
  create map centred on London, zoom 11
  add tile layer with API key
  add empty route source + line layer
```

</td>
<td>

```tsx
useEffect(() => {
  if (!containerRef.current || mapRef.current) return;

  (async () => {
    // Dynamic import avoids SSR crash
    const maplibregl = (await import('maplibre-gl')).default;

    const styleRes = await fetch(`/api/tiles/styles?style=light`);
    const style = await styleRes.json();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [-0.1278, 51.5074], // London
      zoom: 11,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'route', type: 'line', source: 'route',
        paint: { 'line-color': '#059669', 'line-width': 5 },
      });
    });
  })();

  return () => {           // ← cleanup on unmount
    mapRef.current?.remove();
    mapRef.current = null;
  };
}, []); // ← empty array = run once
```

**React concept:** `useEffect` with an empty dependency array `[]` runs exactly once after the first render — equivalent to "on mount". The returned function is the cleanup, called on unmount.

</td>
</tr>

<!-- ─────────────────────────────────────── ClinicMap — markers ─── -->

<tr>
<td><code>components/ClinicMap.tsx</code><br><br>Placing clinic markers with popups</td>
<td>

```
for each active clinic:
  create a green dot marker at [lat, lng]
  attach popup: name, address, phone,
    hours, "Get Directions" button
  add marker to map
```

</td>
<td>

```tsx
clinics
  .filter((c) => c.status === 'active')
  .forEach((clinic) => {
    const el = document.createElement('div');
    el.style.cssText = `
      width:14px; height:14px;
      background:#059669;
      border:2px solid white;
      border-radius:50%;
    `;

    const popup = new maplibregl.Popup({ offset: 10 })
      .setHTML(`
        <b>${clinic.name}</b><br>
        ${clinic.address}<br>
        ${clinic.phone}<br>
        ${clinic.hours}
        <button onclick="window.dispatchEvent(
          new CustomEvent('mapsi:directions',
          {detail:${clinic.id}}))">
          Get Directions
        </button>
      `);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([clinic.lng, clinic.lat])
      .setPopup(popup)
      .addTo(map);

    clinicMarkersRef.current.push({ id: clinic.id, marker, el });
  });
```

**React concept:** The popup button can't call a React function directly (it's raw HTML). Instead it fires a `CustomEvent` on `window`; a separate `useEffect` listens for it and bridges back into React.

</td>
</tr>

<!-- ─────────────────────────────────────── ClinicMap — custom event bridge ─── -->

<tr>
<td><code>components/ClinicMap.tsx</code><br><br>Bridging popup button → React callback</td>
<td>

```
Popup "Get Directions" button fires a
custom browser event.
React listens for that event and calls
the onGetDirections callback prop.
```

</td>
<td>

```tsx
useEffect(() => {
  if (!onGetDirections) return;

  const handler = (e: Event) => {
    const id = (e as CustomEvent<number>).detail;
    const clinic = clinics.find((c) => c.id === id);
    if (clinic) onGetDirections(clinic);
  };

  window.addEventListener('mapsi:directions', handler);
  return () => window.removeEventListener('mapsi:directions', handler);
}, [clinics, onGetDirections]);
```

**React concept:** Always clean up event listeners in the `useEffect` return function. If you don't, the old handler stacks up every re-render. The dependency array `[clinics, onGetDirections]` re-runs this effect when those values change.

</td>
</tr>

<!-- ─────────────────────────────────────── ClinicMap — highlight ─── -->

<tr>
<td><code>components/ClinicMap.tsx</code><br><br>Updating marker colours when nearest clinics change</td>
<td>

```
WHEN highlightIds CHANGES:
  for each clinic marker:
    if clinic.id in highlightIds
      → set colour to bright emerald
    else
      → set colour to standard green
```

</td>
<td>

```tsx
function clinicColor(highlighted: boolean) {
  return highlighted ? '#0d9488' : '#059669';
}

useEffect(() => {
  clinicMarkersRef.current.forEach(({ id, el }) => {
    el.style.background = clinicColor(
      highlightIds.includes(id)
    );
  });
}, [highlightIds]); // ← re-runs when highlightIds changes
```

**React concept:** Dependency array controls *when* an effect re-runs. Listing `[highlightIds]` means "re-run this block every time the parent passes a new list of IDs". The actual DOM update (`.style.background`) happens imperatively because it targets a Leaflet/MapLibre element, not React's virtual DOM.

</td>
</tr>

<!-- ─────────────────────────────────────── ClinicMap — user location ─── -->

<tr>
<td><code>components/ClinicMap.tsx</code><br><br>Placing / moving the user location dot</td>
<td>

```
WHEN userLocation CHANGES:
  remove old user marker (if any)
  place blue dot marker at userLocation
  smoothly pan map to userLocation, zoom 13
```

</td>
<td>

```tsx
useEffect(() => {
  if (!mapRef.current) return;
  (async () => {
    const maplibregl = (await import('maplibre-gl')).default;
    userMarkerRef.current?.remove();   // remove old
    userMarkerRef.current = null;
    if (!userLocation) return;

    const el = document.createElement('div');
    el.style.cssText =
      'width:16px;height:16px;background:#3B82F6;' +
      'border:2px solid white;border-radius:50%;';

    userMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([userLocation[1], userLocation[0]])
      .addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [userLocation[1], userLocation[0]],
      zoom: 13,
      duration: 1000,
    });
  })();
}, [userLocation]);
```

**React concept:** Each effect can respond to a specific piece of state. This effect watches only `userLocation` — it won't re-run when, say, `highlightIds` changes. The optional-chain `?.remove()` safely handles the case where no previous marker exists.

</td>
</tr>

<!-- ─────────────────────────────────────── ClinicMap — route ─── -->

<tr>
<td><code>components/ClinicMap.tsx</code><br><br>Drawing the route polyline</td>
<td>

```
WHEN routeGeoJSON CHANGES:
  if null → clear route layer
  else:
    push GeoJSON into the route source
    zoom map to fit full route
```

</td>
<td>

```tsx
useEffect(() => {
  if (!mapRef.current || !routeReadyRef.current) return;
  const source = mapRef.current.getSource('route') as any;
  if (!source) return;

  if (!routeGeoJSON) {
    source.setData({ type: 'FeatureCollection', features: [] });
    return;
  }

  source.setData(routeGeoJSON);  // map redraws automatically

  // Fit the viewport to the route bounds
  (async () => {
    const maplibregl = (await import('maplibre-gl')).default;
    const fc = routeGeoJSON as {
      features?: Array<{ geometry?: { coordinates?: [number,number][] } }>
    };
    const coords = fc.features?.[0]?.geometry?.coordinates;
    if (coords?.length) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new maplibregl.LngLatBounds(coords[0] as [number,number], coords[0] as [number,number])
      );
      mapRef.current!.fitBounds(bounds, { padding: 40 });
    }
  })();
}, [routeGeoJSON]);
```

**React concept:** `routeReadyRef.current` guards against trying to update the route source before the map's `load` event has fired. State triggers re-renders; refs hold flags that should not.

</td>
</tr>

<!-- ─────────────────────────────────────── locations/page — state ─── -->

<tr>
<td><code>app/locations/page.tsx</code><br><br>State declarations</td>
<td>

```
STATE:
  searchQuery   → text in the search input
  userLocation  → [lat, lng] once located
  nearest       → top-3 closest clinics
  routeGeoJSON  → route data for the map
  routingClinic → name of clinic being fetched
```

</td>
<td>

```tsx
const [searchQuery,   setSearchQuery]   = useState('');
const [searching,     setSearching]     = useState(false);
const [searchError,   setSearchError]   = useState('');
const [userLocation,  setUserLocation]  = useState<[number, number] | null>(null);
const [nearest,       setNearest]       = useState<NearestClinic[]>([]);
const [routeGeoJSON,  setRouteGeoJSON]  = useState<object | null>(null);
const [routingClinic, setRoutingClinic] = useState<string>('');
const [locating,      setLocating]      = useState(false);
```

**React concept:** Each `useState` call returns `[currentValue, setter]`. Calling the setter triggers a re-render. TypeScript generics (`useState<[number,number] | null>`) tell React what shape the value can be.

</td>
</tr>

<!-- ─────────────────────────────────────── locations/page — computeNearest ─── -->

<tr>
<td><code>app/locations/page.tsx</code><br><br>Computing 3 nearest clinics</td>
<td>

```
FUNCTION computeNearest(lat, lng):
  for each clinic:
    calculate haversineKm distance
  sort by distance ascending
  keep top 3
  save to nearest state
```

</td>
<td>

```tsx
function computeNearest(lat: number, lng: number) {
  const ranked = clinics
    .map((c) => ({
      ...c,
      distanceKm: haversineKm(lat, lng, c.lat, c.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  setNearest(ranked);
}
```

**React concept:** `...c` is the spread operator — it copies all clinic fields then adds `distanceKm`. Calling `setNearest(ranked)` stores the new array in state, which re-renders the nearest-clinics panel automatically.

</td>
</tr>

<!-- ─────────────────────────────────────── locations/page — handleSearch ─── -->

<tr>
<td><code>app/locations/page.tsx</code><br><br>Address search (form submit)</td>
<td>

```
FUNCTION handleSearch (form submit):
  call GET /api/geocode?q=searchQuery
  get first result's lat/lon
  set userLocation to [lat, lon]
  call computeNearest(lat, lon)
```

</td>
<td>

```tsx
async function handleSearch(e: React.FormEvent) {
  e.preventDefault();          // stop page reload
  if (!searchQuery.trim()) return;
  setSearching(true);
  setSearchError('');

  try {
    const res = await fetch(
      `/api/geocode?q=${encodeURIComponent(searchQuery)}`
    );
    const data = await res.json();

    const results: Array<{ lat: number; lon: number }> =
      data.results ?? [];

    if (!results.length) {
      setSearchError('No results found.');
      return;
    }

    const { lat, lon } = results[0];
    setUserLocation([lat, lon]);
    computeNearest(lat, lon);
  } catch {
    setSearchError('Search failed. Please try again.');
  } finally {
    setSearching(false);       // always reset loading flag
  }
}
```

**React concept:** `async` event handlers work fine in React. `try/catch/finally` gives clean error and loading-state management. `e.preventDefault()` is essential on form submits to prevent the browser from reloading the page.

</td>
</tr>

<!-- ─────────────────────────────────────── locations/page — useMyLocation ─── -->

<tr>
<td><code>app/locations/page.tsx</code><br><br>GPS "Use My Location"</td>
<td>

```
FUNCTION handleUseMyLocation:
  ask browser for GPS coordinates
  on success → set userLocation,
               call computeNearest
  on failure → show error message
```

</td>
<td>

```tsx
function handleUseMyLocation() {
  if (!navigator.geolocation) {
    setSearchError('Geolocation not supported.');
    return;
  }
  setLocating(true);

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {                   // success callback
      const loc: [number, number] = [
        coords.latitude, coords.longitude
      ];
      setUserLocation(loc);
      computeNearest(coords.latitude, coords.longitude);
      setLocating(false);
    },
    () => {                             // error callback
      setSearchError('Could not get location.');
      setLocating(false);
    }
  );
}
```

**React concept:** The browser's Geolocation API uses old-school callbacks (not Promises). You still call React state setters inside those callbacks — React doesn't mind; it will batch and schedule the re-render.

</td>
</tr>

<!-- ─────────────────────────────────────── locations/page — handleGetDirections ─── -->

<tr>
<td><code>app/locations/page.tsx</code><br><br>Fetching a route (directions)</td>
<td>

```
FUNCTION handleGetDirections (clinic):
  if no userLocation → show error
  call GET /api/directions?origin=...&dest=...
  receive GeoJSON route shape
  save to routeGeoJSON state
  (map draws it automatically)
```

</td>
<td>

```tsx
const handleGetDirections = useCallback(
  async (clinic: Clinic) => {
    if (!userLocation) {
      setSearchError('Search your address first.');
      return;
    }
    setRoutingClinic(clinic.name);
    setRouteGeoJSON(null);

    try {
      const params = new URLSearchParams({
        origin_lat: String(userLocation[0]),
        origin_lon: String(userLocation[1]),
        dest_lat:   String(clinic.lat),
        dest_lon:   String(clinic.lng),
      });
      const res  = await fetch(`/api/directions?${params}`);
      const data = await res.json();
      setRouteGeoJSON(data);       // ClinicMap reacts automatically
    } catch {
      setSearchError('Could not load directions.');
    } finally {
      setRoutingClinic('');
    }
  },
  [userLocation]   // recreate this function only when userLocation changes
);
```

**React concept:** `useCallback` memoises the function so it isn't recreated on every render — important here because `handleGetDirections` is passed as a prop to `ClinicMap`, and a new function reference on every render would cause the map's `useEffect` to re-run needlessly.

</td>
</tr>

<!-- ─────────────────────────────────────── locations/page — render ─── -->

<tr>
<td><code>app/locations/page.tsx</code><br><br>Conditional rendering + passing state to map</td>
<td>

```
RENDER:
  search bar (calls handleSearch)
  "Use My Location" button
  IF nearest is not empty:
    nearest-clinics panel (3 cards)
  <ClinicMap
    clinics, userLocation,
    highlightIds, routeGeoJSON,
    onGetDirections
  />
```

</td>
<td>

```tsx
{/* Nearest Clinics Panel — only shown after a search */}
{nearest.length > 0 && (
  <section>
    {nearest.map((clinic, i) => (
      <div key={clinic.id}>
        <span>{i + 1}</span>
        <h4>{clinic.name}</h4>
        <p>{clinic.distanceKm.toFixed(1)} km</p>
        <button onClick={() => handleGetDirections(clinic)}>
          Directions
        </button>
      </div>
    ))}
  </section>
)}

{/* Map — always rendered, reacts to prop changes */}
<ClinicMap
  clinics={clinics}
  userLocation={userLocation}
  highlightIds={nearest.map((c) => c.id)}
  routeGeoJSON={routeGeoJSON}
  onGetDirections={handleGetDirections}
/>
```

**React concept:** `{condition && <Component />}` is the standard React pattern for conditional rendering. `array.map()` with a `key` prop renders lists. Data flows *down* via props; events flow *up* via callback props (`onGetDirections`).

</td>
</tr>

<!-- ─────────────────────────────────────── geocode route ─── -->

<tr>
<td><code>app/api/geocode/route.ts</code><br><br>Server-side geocoding proxy</td>
<td>

```
ENDPOINT: GET /api/geocode?q={address}

VALIDATE:
  if q missing → 400
  if API key missing → 500

CALL MAPSI:
  fetch geocode API with key in header

RETURN:
  normalised { results: [{lat, lon}] }
```

</td>
<td>

```ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q)
    return NextResponse.json({ error: 'Missing q' }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const url =
    `https://mapsi.dev/v1/geocode?q=${encodeURIComponent(q)}&limit=5`;
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });

  if (!res.ok)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status });

  const data = await res.json();

  // Normalise Mapsi shape → flat { lat, lon }
  const results = (data.results ?? []).map(
    (r: { coordinates: { lat: number; lon: number }; formatted_address: string }) => ({
      lat: r.coordinates.lat,
      lon: r.coordinates.lon,
      formatted_address: r.formatted_address,
    })
  );

  return NextResponse.json({ results });
}
```

**React / Next.js concept:** Exporting a named `GET` function from `app/api/.../route.ts` creates a server-side API endpoint. The API key lives in `process.env` — the browser never sees it. `NextResponse.json()` is the standard way to return JSON with a status code.

</td>
</tr>

<!-- ─────────────────────────────────────── directions route ─── -->

<tr>
<td><code>app/api/directions/route.ts</code><br><br>Server-side routing proxy</td>
<td>

```
ENDPOINT: GET /api/directions?
            origin_lat&origin_lon&
            dest_lat&dest_lon

VALIDATE: all 4 coords present + API key

CALL MAPSI routing API

RETURN:
  GeoJSON FeatureCollection
  (ClinicMap draws as green polyline)
```

</td>
<td>

```ts
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const originLat = searchParams.get('origin_lat');
  const originLon = searchParams.get('origin_lon');
  const destLat   = searchParams.get('dest_lat');
  const destLon   = searchParams.get('dest_lon');

  if (!originLat || !originLon || !destLat || !destLon)
    return NextResponse.json({ error: 'Missing coords' }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const url = `https://mapsi.dev/v1/route?` +
    `origin_lat=${originLat}&origin_lon=${originLon}` +
    `&dest_lat=${destLat}&dest_lon=${destLon}`;

  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });

  if (!res.ok)
    return NextResponse.json({ error: 'Routing failed' }, { status: res.status });

  const data = await res.json();

  // Wrap Mapsi's LineString in a GeoJSON FeatureCollection
  // so MapLibre's setData() accepts it directly
  return NextResponse.json({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: data.polyline, properties: {} }],
  });
}
```

**React / Next.js concept:** Both API routes follow the same pattern: validate → fetch external API with secret key → normalise the response shape → return JSON. The browser calls `/api/directions`, never `mapsi.dev` directly — so the API key is never exposed.

</td>
</tr>

</tbody>
</table>

---

## React Patterns Quick Reference

| Pattern | Where used in this project |
|---|---|
| `useState` | Every piece of UI state in `locations/page.tsx` (query, location, nearest, route) |
| `useEffect` with `[]` | Map initialisation in `ClinicMap.tsx` — runs once on mount |
| `useEffect` with deps | Highlight colours, user dot, route line — each watches one piece of state |
| `useRef` | Storing the map/marker instances without triggering re-renders |
| `useCallback` | Memoising `handleGetDirections` so it doesn't recreate on every render |
| `{condition && <JSX>}` | Showing the nearest-clinics panel only after a search |
| `array.map()` + `key` | Rendering the nearest-clinics cards and the full clinic grid |
| Props down / callbacks up | `ClinicMap` receives data as props; reports user actions via `onGetDirections` |
| Dynamic import | `import('maplibre-gl')` inside an effect — loads only in the browser, avoids SSR crash |
| `async GET` route export | Next.js App Router API routes in `app/api/**/route.ts` |
