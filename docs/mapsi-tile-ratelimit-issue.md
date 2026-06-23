# Mapsi.dev Tile Rate Limiting — Issue Analysis & Solutions

**Project:** Magnetrock Clinic Finder  
**Stack:** Next.js (App Router) on Vercel Serverless  
**Date:** 2026-05-21  

---

## What Was Observed

Two types of errors in the browser console when the locations page loads:

```
status: 0   — NetworkError when attempting to fetch resource
status: 429 — Too Many Requests
url: https://mapsi.dev/v1/tiles/planet/11/1023/681?key=mapsi_free_...
```

The map background was blank — only the green clinic markers were visible.

---

## Root Cause 1 — TileJSON URL Rewriting Bug (Fixed)

### What happened

The proxy at `/api/tiles/[...slug]/route.ts` was designed to intercept all tile
requests so the browser never calls `mapsi.dev` directly (which would be CORS-blocked).

Mapsi style JSON uses two types of tile sources:

- **`tiles` array** — direct URL templates: `["https://mapsi.dev/v1/tiles/planet/{z}/{x}/{y}?key=..."]`
- **`url` (TileJSON)** — a metadata endpoint: `"https://mapsi.dev/v1/tiles/planet?key=..."` — MapLibre fetches this separately and reads the `tiles` array from the response.

`ClinicMap.tsx` rewrote `tiles` and `url` in `style.sources` before passing the style to MapLibre. That correctly redirected the TileJSON fetch to the proxy. **But the proxy was forwarding the raw TileJSON response unchanged.** That raw JSON from mapsi.dev contained the original `https://mapsi.dev/...` tile URLs. MapLibre read those and made direct requests to mapsi.dev — hitting CORS blocks (status 0) and the rate limit (429).

### Fix applied

The proxy now detects JSON responses (both style spec and TileJSON) and recursively
rewrites all `https://mapsi.dev/v1/tiles/` URLs to `/api/tiles/` before returning
them to the client. MapLibre never sees a mapsi.dev URL.

```typescript
function rewriteJson(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj
      .replace(/https:\/\/mapsi\.dev\/v1\/tiles\//g, '/api/tiles/')
      .replace(/[?&]key=[^&]+/g, '');
  }
  if (Array.isArray(obj)) return obj.map(rewriteJson);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, rewriteJson(v)])
    );
  }
  return obj;
}
```

**Status: Fixed and deployed.**

---

## Root Cause 2 — Serverless Throttle Does Not Work on Vercel (Open)

### What happened

The proxy uses a module-level variable to throttle requests:

```typescript
let lastFetch = 0;
const MIN_GAP_MS = 350; // ~2.86 req/sec
```

In a persistent Node.js process (local dev server) this works — `lastFetch` is shared
across all requests. On Vercel, each API route invocation runs in a separate serverless
lambda. Every cold (and many warm) invocations start with `lastFetch = 0`. When the map
loads and requests ~15 tiles simultaneously, 15 lambdas fire in parallel — each thinking
no request has been made — and all hit mapsi.dev at once, triggering 429s.

### Why the tile burst is large

A map viewport at zoom 11 needs roughly 12–16 tiles. On pan or zoom, another batch is
requested. With no effective throttle across lambdas, the free tier's 3 req/sec cap is
exceeded immediately on every page load.

### Mapsi.dev free tier limits (confirmed)

| Limit | Value |
|-------|-------|
| Calls / day | 3,000 |
| Requests / second | 3 |
| API keys | 1 |

All API types (tiles, geocode, routing) share the same key and the same daily budget.

### Daily call budget reality check

~15 tile calls per page load (zoom 11, typical viewport):

| Plan | Daily calls | Approx. page loads (tiles only) |
|------|-------------|----------------------------------|
| Free ($0) | 3,000 | ~200 |
| Hobby ($15/mo) | 10,000 | ~650 |
| Growth ($29/mo) | 35,000 | ~2,300 |

---

## Probable Solutions

### Solution A — Upstash Redis for shared throttle state (Recommended for Vercel + mapsi)

Replace the module-level variable with a Redis key shared across all lambda instances.
Upstash has a native Vercel integration and a permanent free tier.

**Setup:**
1. Add Upstash Redis from the Vercel Marketplace (auto-injects env vars)
2. `npm install @upstash/redis`

**Code change in `/app/api/tiles/[...slug]/route.ts`:**

```typescript
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

async function throttledFetch(url: string, apiKey: string): Promise<Response> {
  const last = await redis.get<number>('mapsi:lastFetch') ?? 0;
  const wait = Math.max(0, last + MIN_GAP_MS - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  await redis.set('mapsi:lastFetch', Date.now(), { px: 5000 });
  return fetch(url, { headers: { 'X-API-Key': apiKey } });
}
```

**Pros:** Correct fix for serverless, stays on mapsi.dev, Upstash free tier sufficient  
**Cons:** Adds an external dependency, small Redis latency per tile request (~20ms)  
**Cost:** Free (Upstash free tier: 10k commands/day)

---

### Solution B — Split providers: keep mapsi for geocode/routing, swap tiles

Use a free tile provider with no per-second rate limit, keep mapsi.dev only for
geocoding and routing (both are user-triggered and well within 3 req/sec).

**Candidate tile providers:**

| Provider | Cost | Rate limit | Notes |
|----------|------|------------|-------|
| OpenFreeMap | Free forever | None | OSM data, MIT licence, self-hostable |
| MapTiler | Free (100k tiles/mo) | None per-sec | High quality, requires attribution |
| Stadia Maps | Free (limited) | None per-sec | Good free tier for small sites |

**Code change in `ClinicMap.tsx`:** Replace the style fetch with a direct MapLibre style URL or a static style object pointing to the new provider's tile URL.

**Pros:** Eliminates the rate limit problem at source, no Redis needed  
**Cons:** Map style may look different; two providers to manage  
**Cost:** Free

---

### Solution C — Upgrade mapsi.dev plan

Move to Hobby ($15/mo): 10 req/sec and 10,000 calls/day. The burst problem is reduced
but **not eliminated** — without shared throttle state on Vercel, 15 lambdas still fire
simultaneously regardless of the plan. The higher req/sec limit just means fewer of them
get rejected.

**Correct approach:** Upgrade plan AND implement Solution A (Redis throttle).

**Pros:** Single provider, higher headroom  
**Cons:** Monthly cost, still needs Redis fix to fully solve the burst problem  
**Cost:** $15/mo + Upstash free tier

---

### Solution D — Rely on Vercel CDN caching (partial mitigation, no code change)

The proxy already returns `Cache-Control: public, max-age=86400`. Vercel caches each
tile response at the edge after the first request. For repeat visitors or the same
viewport, zero upstream requests are made. This naturally reduces daily call consumption
over time.

**Limitation:** Does not help on the very first load of a tile (cold cache). The initial
burst on a fresh deploy or new viewport will still 429 until Redis (Solution A) is in place.

**Pros:** Already implemented, zero effort  
**Cons:** Only helps after warm-up; not a fix, just a mitigation  
**Cost:** Free

---

## Recommended Path

| Situation | Action |
|-----------|--------|
| Low traffic site, tight budget | Solution A (Upstash, free) + stay on free mapsi plan |
| Want fastest map load, willing to pay | Solution A + Hobby plan |
| Want zero infrastructure overhead | Solution B (swap tile provider) |
| High traffic production app | Solution B for tiles + Solution A for geocode/routing calls |

The Vercel CDN caching (Solution D) applies in all cases and is already in place.

---

## APIs Used in This Project (all mapsi.dev, same key)

| Route | Upstream | Triggered by |
|-------|----------|--------------|
| `/api/tiles/styles` | `mapsi.dev/v1/tiles/styles` | Map init (once) |
| `/api/tiles/planet/{z}/{x}/{y}` | `mapsi.dev/v1/tiles/planet/...` | Map load, pan, zoom |
| `/api/geocode` | `mapsi.dev/v1/geocode` | User postcode search |
| `/api/directions` | `mapsi.dev/v1/route` | User clicks "Get Directions" |

Only the tile endpoint generates burst traffic. Geocode and routing are single calls
triggered by explicit user actions and are well within any plan's rate limit.
