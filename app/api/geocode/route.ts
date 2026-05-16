import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const url = `https://api.mapsi.dev/v1/geocode/search?q=${encodeURIComponent(q)}&limit=5`;
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });

  if (!res.ok) {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
