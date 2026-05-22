'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useRef, useCallback } from 'react';
import { Header, Footer } from '../page';
import { ZONE_STYLES } from '@/components/CoverageLayer';

const ClinicMiniMap = dynamic(() => import('@/components/ClinicMiniMap'), { ssr: false });

type ZoneKey = keyof typeof ZONE_STYLES;

type CoverageResult = {
  zone: ZoneKey | null;
  label: string;
  fee: number;
  currency: string;
  note: string;
};

type Suggestion = {
  lat: number;
  lon: number;
  formatted_address: string;
};

export default function BookingPage() {
  const [formData, setFormData] = useState({
    petName: '',
    petType: 'dog',
    ownerName: '',
    address: '',
    phone: '',
    reason: '',
    preferredDate: '',
  });

  // Autocomplete + coverage check state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
      setShowSuggestions(true);
    } catch { setSuggestions([]); }
  }, []);

  function handleAddressChange(value: string) {
    setFormData((f) => ({ ...f, address: value }));
    setCoverageResult(null);
    setUserLocation(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 320);
  }

  async function selectSuggestion(s: Suggestion) {
    setFormData((f) => ({ ...f, address: s.formatted_address }));
    setShowSuggestions(false);
    setSuggestions([]);
    const loc: [number, number] = [s.lat, s.lon];
    setUserLocation(loc);

    try {
      const res = await fetch(`/api/coverage?lat=${s.lat}&lon=${s.lon}`);
      const data: CoverageResult = await res.json();
      setCoverageResult(data);
    } catch { /* coverage check failed silently */ }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Booking functionality will be connected to backend');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="booking" />

      {/* Page Header */}
      <section className="bg-emerald-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Book an Appointment</h2>
          <p className="text-xl text-gray-600">
            We'll check if home visit is available in your area
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pet Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Pet Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Name
                  </label>
                  <input
                    type="text"
                    value={formData.petName}
                    onChange={(e) => setFormData({...formData, petName: e.target.value})}
                    placeholder="e.g., Max"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Type
                  </label>
                  <select
                    value={formData.petType}
                    onChange={(e) => setFormData({...formData, petType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Your Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    placeholder="John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address (for home visit check)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Start typing your postcode or address…"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    autoComplete="off"
                    required
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onMouseDown={() => selectSuggestion(s)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 text-gray-800"
                          >
                            {s.formatted_address}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+44 20 1234 5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Coverage check result + mini-map */}
            {!coverageResult && !userLocation && (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500">
                Enter your address above to check home visit availability
              </div>
            )}

            {coverageResult && (
              <div
                className={`rounded-lg border-2 p-4 ${
                  coverageResult.zone && coverageResult.zone !== 'outer'
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-amber-400 bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">
                    {coverageResult.zone && coverageResult.zone !== 'outer' ? '✅' : '⚠️'}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{coverageResult.note}</p>
                    {coverageResult.fee > 0 && (
                      <p className="text-sm text-gray-700 mt-0.5">
                        Home visit fee: <strong>{coverageResult.currency}{coverageResult.fee}</strong>
                        {' '}<span className="text-gray-500">({coverageResult.label})</span>
                      </p>
                    )}
                  </div>
                </div>
                {userLocation && (
                  <ClinicMiniMap
                    userLocation={userLocation}
                    zone={coverageResult.zone}
                  />
                )}
              </div>
            )}

            {/* Appointment Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Appointment Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Visit
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="checkup">General Check-up</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="emergency">Emergency</option>
                    <option value="dental">Dental Care</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              Book Appointment
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}