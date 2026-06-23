import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const url = `https://mapsi.dev/v1/geocode?q=${encodeURIComponent(q)}&limit=5`;
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });

  if (!res.ok) {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status });
  }

  const data = await res.json();

  // Normalize Mapsi's { coordinates: { lat, lon } } to flat { lat, lon } for the frontend
  const results = (data.results ?? []).map((r: { coordinates: { lat: number; lon: number }; formatted_address: string }) => ({
    lat: r.coordinates.lat,
    lon: r.coordinates.lon,
    formatted_address: r.formatted_address,
  }));

  return NextResponse.json({ results });
}
