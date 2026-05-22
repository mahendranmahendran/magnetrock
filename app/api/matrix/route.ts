import { NextRequest, NextResponse } from 'next/server';
import clinicsData from '@/data/clinics.json';
import type { Clinic } from '@/components/ClinicMap';

// GET /api/matrix?origin_lat=51.5&origin_lon=-0.1
// Calls the Mapsi Matrix API to get drive-time (seconds) from origin to all active clinics.
// Returns [ { id, name, driveTimeSeconds, driveTimeMinutes } ] sorted by drive time.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const originLat = searchParams.get('origin_lat');
  const originLon = searchParams.get('origin_lon');

  if (!originLat || !originLon) {
    return NextResponse.json({ error: 'Missing origin_lat or origin_lon' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPSI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const clinics = (clinicsData as Clinic[]).filter((c) => c.status === 'active');

  // Mapsi Matrix API: POST with JSON body containing sources + targets
  const body = {
    sources: [{ lat: parseFloat(originLat), lon: parseFloat(originLon) }],
    targets: clinics.map((c) => ({ lat: c.lat, lon: c.lng })),
  };

  const res = await fetch('https://mapsi.dev/v1/matrix', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Matrix request failed' }, { status: res.status });
  }

  const data = await res.json();

  // Mapsi returns { durations: [[seconds_to_target_0, seconds_to_target_1, ...]] }
  const durations: number[] = data.durations?.[0] ?? [];

  const results = clinics
    .map((clinic, i) => ({
      id: clinic.id,
      name: clinic.name,
      driveTimeSeconds: durations[i] ?? null,
      driveTimeMinutes: durations[i] != null ? Math.ceil(durations[i] / 60) : null,
    }))
    .filter((r) => r.driveTimeSeconds !== null)
    .sort((a, b) => (a.driveTimeSeconds ?? 0) - (b.driveTimeSeconds ?? 0));

  return NextResponse.json({ results });
}
