import { NextRequest, NextResponse } from 'next/server';

// Serialise tile fetches server-side to stay within Mapsi free tier (2 req/sec)
let lastFetch = 0;
const MIN_GAP_MS = 520; // ~1.9 req/sec, safely under the 2/sec cap

async function throttledFetch(url: string, apiKey: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, lastFetch + MIN_GAP_MS - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetch = Date.now();
  return fetch(url, { headers: { 'X-API-Key': apiKey } });
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

  const body = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';

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
