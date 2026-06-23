import { NextRequest, NextResponse } from 'next/server';

// Serialise tile fetches server-side to stay within Mapsi free tier (3 req/sec)
let lastFetch = 0;
const MIN_GAP_MS = 350; // ~2.86 req/sec, safely under the 3/sec cap

async function throttledFetch(url: string, apiKey: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, lastFetch + MIN_GAP_MS - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetch = Date.now();
  return fetch(url, { headers: { 'X-API-Key': apiKey } });
}

// Recursively rewrite any mapsi tile URLs in JSON so the browser never calls mapsi.dev directly.
// This fixes TileJSON sources: MapLibre fetches the TileJSON through the proxy, but the raw
// TileJSON from mapsi.dev contains direct tile URL templates that MapLibre would use as-is.
function rewriteJson(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj
      .replace(/https?:\/\/[^/]*mapsi\.dev(?:\/v\d+)?\/tiles\//g, '/api/tiles/')
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey) return new NextResponse('API key not configured', { status: 500 });

  // Forward any query params from the original request (e.g. ?style=light)
  const search = request.nextUrl.searchParams.toString();
  const query = search ? `?${search}&key=${apiKey}` : `?key=${apiKey}`;

  const tilePath = slug.join('/');
  const upstreamUrl = `https://mapsi.dev/v1/tiles/${tilePath}${query}`;

  // Style JSON: no throttle — it's a single fetch, not a tile stream
  const isStyle = slug[0] === 'styles';
  const res = isStyle
    ? await fetch(upstreamUrl, { headers: { 'X-API-Key': apiKey } })
    : await throttledFetch(upstreamUrl, apiKey);

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';

  // Rewrite all mapsi.dev tile URLs in any JSON response (style spec or TileJSON) before
  // sending to the client, so MapLibre always routes tile requests through this proxy.
  if (contentType.includes('application/json')) {
    const json = await res.json();
    const rewritten = rewriteJson(json);
    return new NextResponse(JSON.stringify(rewritten), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': isStyle
          ? 'public, max-age=3600'
          : 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Cache tiles 24 h — drastically cuts repeat requests on pan/zoom
      'Cache-Control': isStyle
        ? 'public, max-age=3600'
        : 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
