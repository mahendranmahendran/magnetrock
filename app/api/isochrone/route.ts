import { NextRequest, NextResponse } from 'next/server';

// GET /api/isochrone?lat=51.53&lon=-0.14&minutes=15,30,45
// Returns a GeoJSON FeatureCollection of isochrone polygons from Mapsi.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const minutes = searchParams.get('minutes') ?? '15,30,45';

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const url = `https://mapsi.dev/v1/isochrone?lat=${lat}&lon=${lon}&minutes=${encodeURIComponent(minutes)}`;
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });

  if (!res.ok) {
    return NextResponse.json({ error: 'Isochrone request failed' }, { status: res.status });
  }

  const data = await res.json();

  // Mapsi returns a GeoJSON FeatureCollection of Polygon features tagged with
  // { minutes: 15 | 30 | 45 } in their properties — pass through as-is.
  return NextResponse.json(data);
}
