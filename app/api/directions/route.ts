import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const originLat = searchParams.get('origin_lat');
  const originLng = searchParams.get('origin_lng');
  const destLat = searchParams.get('dest_lat');
  const destLng = searchParams.get('dest_lng');

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  // Mapsi routing: points=lat,lng|lat,lng
  const points = `${originLat},${originLng}|${destLat},${destLng}`;
  const url = `https://api.mapsi.dev/v1/route?points=${encodeURIComponent(points)}&overview=full`;
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });

  if (!res.ok) {
    return NextResponse.json({ error: 'Routing failed' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
