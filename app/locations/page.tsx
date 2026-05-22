'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import { Header, Footer } from '../page';
import { haversineKm } from '@/lib/haversine';
import type { Clinic } from '@/components/ClinicMap';
import CoverageLayer, { type ZoneMode } from '@/components/CoverageLayer';
import clinicsData from '@/data/clinics.json';
import zonesData from '@/data/coverage-zones.json';

const ClinicMap = dynamic(() => import('@/components/ClinicMap'), { ssr: false });

const clinics: Clinic[] = clinicsData.filter((c) => c.status === 'active') as Clinic[];

type NearestClinic = Clinic & { distanceKm: number };

export default function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearest, setNearest] = useState<NearestClinic[]>([]);
  const [routeGeoJSON, setRouteGeoJSON] = useState<object | null>(null);
  const [routingClinic, setRoutingClinic] = useState<string>('');
  const [locating, setLocating] = useState(false);

  // Coverage zones state
  const [showZones, setShowZones] = useState(false);
  const [zoneMode, setZoneMode] = useState<ZoneMode>('fixed');
  const [coverageZones, setCoverageZones] = useState<object | null>(null);
  const [isochroneLoading, setIsochroneLoading] = useState(false);

  // Drive-time ranking state
  const [driveTimeMode, setDriveTimeMode] = useState(false);
  const [driveTimeLoading, setDriveTimeLoading] = useState(false);
  const [driveTimeRanking, setDriveTimeRanking] = useState<{ id: number; driveTimeMinutes: number }[]>([]);

  // Load fixed zones from local data on mount
  useEffect(() => {
    setCoverageZones(zonesData);
  }, []);

  // Fetch isochrone zones for nearest clinics when user location + isochrone mode is active
  useEffect(() => {
    if (zoneMode !== 'isochrone' || !userLocation || !showZones) return;
    let cancelled = false;
    setIsochroneLoading(true);

    (async () => {
      try {
        // Fetch one isochrone per nearest clinic (up to 3) and merge into a FeatureCollection
        const targets = nearest.length > 0 ? nearest.slice(0, 3) : clinics.slice(0, 3);
        const requests = targets.map((c) =>
          fetch(`/api/isochrone?lat=${c.lat}&lon=${c.lng}&minutes=30`)
            .then((r) => r.json())
            .catch(() => null)
        );
        const results = await Promise.all(requests);
        if (cancelled) return;

        const features = results
          .filter(Boolean)
          .flatMap((fc: { features?: unknown[] }) => fc?.features ?? []);

        if (features.length > 0) {
          setCoverageZones({ type: 'FeatureCollection', features });
        }
      } finally {
        if (!cancelled) setIsochroneLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [zoneMode, userLocation, showZones, nearest]);

  // Restore fixed zones when switching back
  useEffect(() => {
    if (zoneMode === 'fixed') {
      setCoverageZones(zonesData);
    }
  }, [zoneMode]);

  // Fetch drive-time ranking when drive-time mode toggled on
  useEffect(() => {
    if (!driveTimeMode || !userLocation) return;
    let cancelled = false;
    setDriveTimeLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/matrix?origin_lat=${userLocation[0]}&origin_lon=${userLocation[1]}`
        );
        const data = await res.json();
        if (!cancelled && data.results) {
          setDriveTimeRanking(data.results.slice(0, 3));
        }
      } catch { /* fall back to haversine */ } finally {
        if (!cancelled) setDriveTimeLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [driveTimeMode, userLocation]);

  function computeNearest(lat: number, lng: number) {
    const ranked = clinics
      .map((c) => ({ ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
    setNearest(ranked);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    setRouteGeoJSON(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      const results: Array<{ lat: number; lon: number }> = data.results ?? data.features?.map(
        (f: { geometry: { coordinates: [number, number] } }) => ({
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
        })
      ) ?? [];

      if (!results.length) {
        setSearchError('No results found. Try a different postcode or area name.');
        return;
      }

      const { lat, lon } = results[0];
      const loc: [number, number] = [lat, lon];
      setUserLocation(loc);
      computeNearest(lat, lon);
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setSearchError('');
    setRouteGeoJSON(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc: [number, number] = [coords.latitude, coords.longitude];
        setUserLocation(loc);
        computeNearest(coords.latitude, coords.longitude);
        setLocating(false);
      },
      () => {
        setSearchError('Could not get your location. Please allow location access.');
        setLocating(false);
      }
    );
  }

  const handleGetDirections = useCallback(
    async (clinic: Clinic) => {
      if (!userLocation) {
        setSearchError('Please search for your address or use "Use My Location" first.');
        return;
      }
      setRoutingClinic(clinic.name);
      setRouteGeoJSON(null);

      try {
        const params = new URLSearchParams({
          origin_lat: String(userLocation[0]),
          origin_lon: String(userLocation[1]),
          dest_lat: String(clinic.lat),
          dest_lon: String(clinic.lng),
        });
        const res = await fetch(`/api/directions?${params}`);
        const data = await res.json();

        // Support both GeoJSON FeatureCollection and a route object with geometry
        const geojson =
          data.type === 'FeatureCollection'
            ? data
            : data.paths?.[0]?.points ?? data.geometry ?? data.route ?? null;

        setRouteGeoJSON(geojson);
      } catch {
        setSearchError('Could not load directions. Please try again.');
      } finally {
        setRoutingClinic('');
      }
    },
    [userLocation]
  );

  // When drive-time mode is on and we have rankings, reorder nearest by drive time
  const displayNearest: NearestClinic[] = driveTimeMode && driveTimeRanking.length > 0
    ? driveTimeRanking
        .map((r) => {
          const clinic = nearest.find((c) => c.id === r.id) ?? clinics.find((c) => c.id === r.id);
          return clinic ? { ...clinic, distanceKm: (r.driveTimeMinutes ?? 0) / 60 } : null;
        })
        .filter((c): c is NearestClinic => c !== null)
    : nearest;

  const highlightIds = displayNearest.map((c) => c.id);

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="locations" />

      {/* Page Header */}
      <section className="bg-emerald-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Find Your Nearest Clinic</h2>
          <p className="text-xl text-gray-600">12 locations across London — always one nearby</p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your postcode or area (e.g., NW1, Camden)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </form>

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={handleUseMyLocation}
                disabled={locating}
                className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 disabled:opacity-50"
              >
                📍 {locating ? 'Locating…' : 'Use My Location'}
              </button>
              {searchError && (
                <p className="text-sm text-red-600">{searchError}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Nearest Clinics Panel (shown after search/location) */}
      {nearest.length > 0 && (
        <section className="py-6 bg-emerald-50 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {routingClinic ? `Getting directions to ${routingClinic}…` : '3 Nearest Clinics'}
              </h3>
              {/* Drive-time toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {driveTimeMode ? 'By drive time' : 'By distance'}
                </span>
                <button
                  onClick={() => setDriveTimeMode((v) => !v)}
                  disabled={driveTimeLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                    driveTimeMode ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                  title="Toggle drive-time ranking (Matrix API)"
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${driveTimeMode ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {displayNearest.map((clinic, i) => (
                <div key={clinic.id} className="bg-white rounded-lg p-4 shadow-sm border border-emerald-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-white bg-emerald-600 rounded-full w-6 h-6 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {driveTimeMode && driveTimeRanking.length > 0
                        ? (() => {
                            const r = driveTimeRanking.find((x) => x.id === clinic.id);
                            return r ? `${r.driveTimeMinutes} min` : '—';
                          })()
                        : clinic.distanceKm < 1
                          ? `${Math.round(clinic.distanceKm * 1000)} m`
                          : `${clinic.distanceKm.toFixed(1)} km`}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">{clinic.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{clinic.address}</p>
                  <p className="text-xs text-gray-500">{clinic.hours}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleGetDirections(clinic)}
                      disabled={!!routingClinic}
                      className="flex-1 text-xs bg-emerald-600 text-white py-1.5 rounded font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Directions
                    </button>
                    <Link
                      href="/booking"
                      className="flex-1 text-xs border border-emerald-600 text-emerald-600 py-1.5 rounded font-semibold hover:bg-emerald-50 text-center"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <ClinicMap
            clinics={clinics}
            userLocation={userLocation}
            highlightIds={highlightIds}
            routeGeoJSON={routeGeoJSON}
            onGetDirections={handleGetDirections}
            coverageZones={coverageZones}
            showZones={showZones}
          />
          {!userLocation && (
            <p className="text-sm text-gray-400 text-center mt-2">
              Search your postcode or use "Use My Location" to find your nearest clinic
            </p>
          )}
          {/* Zone legend + toggle */}
          <CoverageLayer
            visible={showZones}
            onToggle={() => setShowZones((v) => !v)}
            zoneMode={zoneMode}
            onZoneModeChange={setZoneMode}
            isochroneLoading={isochroneLoading}
            requiresLocation={!userLocation}
          />
        </div>
      </section>

      {/* Full Clinic List */}
      <section className="py-8 bg-emerald-50">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-6">All Clinics</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-xl font-bold text-emerald-700 mb-2">{clinic.name}</h4>
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600">📍</span>
                    <span className="text-sm">{clinic.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">📞</span>
                    <span className="text-sm">{clinic.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">🕐</span>
                    <span className="text-sm">{clinic.hours}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => handleGetDirections(clinic)}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-emerald-700"
                  >
                    Get Directions
                  </button>
                  <Link
                    href="/booking"
                    className="flex-1 bg-white text-emerald-600 px-4 py-2 rounded text-sm font-semibold border border-emerald-600 hover:bg-emerald-50 text-center"
                  >
                    Book Here
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
