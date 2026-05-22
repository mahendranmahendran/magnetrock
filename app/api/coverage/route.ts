import { NextRequest, NextResponse } from 'next/server';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon, FeatureCollection } from 'geojson';
import zonesData from '@/data/coverage-zones.json';
import feesData from '@/data/coverage-fees.json';

type ZoneKey = keyof typeof feesData;

// GET /api/coverage?lat=51.46&lon=-0.14
// Returns which coverage zone the coordinate falls in and the applicable fee.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });
  }

  const pt = point([parseFloat(lon), parseFloat(lat)]);
  const zones = (zonesData as FeatureCollection).features as Feature<Polygon>[];

  // Check most-specific zone first (central → inner → outer)
  const priority: ZoneKey[] = ['central', 'inner', 'outer'];
  for (const zoneKey of priority) {
    const feature = zones.find((f) => f.properties?.zone === zoneKey);
    if (feature && booleanPointInPolygon(pt, feature)) {
      const fee = feesData[zoneKey];
      return NextResponse.json({ zone: zoneKey, ...fee });
    }
  }

  return NextResponse.json({
    zone: null,
    label: 'Outside Greater London',
    fee: 0,
    currency: '£',
    note: 'Outside service area',
  });
}
