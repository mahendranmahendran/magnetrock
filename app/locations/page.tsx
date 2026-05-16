'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { Header, Footer } from '../page';
import { haversineKm } from '@/lib/haversine';
import type { Clinic } from '@/components/ClinicMap';
import clinicsData from '@/data/clinics.json';

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
          origin_lng: String(userLocation[1]),
          dest_lat: String(clinic.lat),
          dest_lng: String(clinic.lng),
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

  const highlightIds = nearest.map((c) => c.id);

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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              {routingClinic ? `Getting directions to ${routingClinic}…` : '3 Nearest Clinics'}
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {nearest.map((clinic, i) => (
                <div key={clinic.id} className="bg-white rounded-lg p-4 shadow-sm border border-emerald-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-white bg-emerald-600 rounded-full w-6 h-6 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {clinic.distanceKm < 1
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
          />
          {!userLocation && (
            <p className="text-sm text-gray-400 text-center mt-2">
              Search your postcode or use "Use My Location" to find your nearest clinic
            </p>
          )}
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
