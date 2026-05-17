import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const originLat = searchParams.get('origin_lat');
  const originLon = searchParams.get('origin_lon');
  const destLat = searchParams.get('dest_lat');
  const destLon = searchParams.get('dest_lon');

  if (!originLat || !originLon || !destLat || !destLon) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const url = `https://mapsi.dev/v1/route?origin_lat=${originLat}&origin_lon=${originLon}&dest_lat=${destLat}&dest_lon=${destLon}`;
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });

  if (!res.ok) {
    return NextResponse.json({ error: 'Routing failed' }, { status: res.status });
  }

  const data = await res.json();

  // Mapsi returns polyline as a GeoJSON LineString — wrap as FeatureCollection for Leaflet/MapLibre
  const geometry = data.polyline;
  if (!geometry) {
    return NextResponse.json({ error: 'No route found' }, { status: 404 });
  }

  return NextResponse.json({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry, properties: {} }],
  });
}
