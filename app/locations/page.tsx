// app/locations/page.tsx - Clinic Locator
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header, Footer } from '../page';

export default function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const clinics = [
    { id: 1, name: 'PawCare Camden', address: '123 Camden High Street, London NW1 7JE', phone: '+44 20 7946 0001', hours: '8am - 8pm', lat: 51.5392, lng: -0.1426 },
    { id: 2, name: 'PawCare Shoreditch', address: '45 Brick Lane, London E1 6PU', phone: '+44 20 7946 0002', hours: '8am - 8pm', lat: 51.5214, lng: -0.0713 },
    { id: 3, name: 'PawCare Notting Hill', address: '78 Portobello Road, London W11 2QD', phone: '+44 20 7946 0003', hours: '9am - 7pm', lat: 51.5158, lng: -0.2058 },
    { id: 4, name: 'PawCare Clapham', address: '56 Clapham High Street, London SW4 7UL', phone: '+44 20 7946 0004', hours: '8am - 8pm', lat: 51.4622, lng: -0.1400 },
    { id: 5, name: 'PawCare Hampstead', address: '12 Heath Street, London NW3 6TE', phone: '+44 20 7946 0005', hours: '9am - 6pm', lat: 51.5564, lng: -0.1776 },
    { id: 6, name: 'PawCare Greenwich', address: '89 Greenwich High Road, London SE10 8JA', phone: '+44 20 7946 0006', hours: '8am - 8pm', lat: 51.4769, lng: -0.0070 },
    { id: 7, name: 'PawCare Wimbledon', address: '34 Wimbledon Hill Road, London SW19 7PA', phone: '+44 20 7946 0007', hours: '8am - 7pm', lat: 51.4227, lng: -0.2056 },
    { id: 8, name: 'PawCare Islington', address: '67 Upper Street, London N1 0NY', phone: '+44 20 7946 0008', hours: '8am - 8pm', lat: 51.5387, lng: -0.1033 },
    { id: 9, name: 'PawCare Richmond', address: '23 George Street, Richmond TW9 1HY', phone: '+44 20 7946 0009', hours: '9am - 6pm', lat: 51.4613, lng: -0.3037 },
    { id: 10, name: 'PawCare Brixton', address: '91 Brixton Road, London SW9 6DE', phone: '+44 20 7946 0010', hours: '8am - 8pm', lat: 51.4627, lng: -0.1145 },
    { id: 11, name: 'PawCare Canary Wharf', address: '15 Canada Square, London E14 5AB', phone: '+44 20 7946 0011', hours: '7am - 9pm', lat: 51.5054, lng: -0.0235 },
    { id: 12, name: 'PawCare King\'s Cross', address: '42 York Way, London N1 9AG', phone: '+44 20 7946 0012', hours: '24/7 Emergency', lat: 51.5356, lng: -0.1200 }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="locations" />

      {/* Page Header */}
      <section className="bg-emerald-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Find Your Nearest Clinic</h2>
          <p className="text-xl text-gray-600">
            12 locations across London - always one nearby
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your postcode or area (e.g., NW1, Camden, King's Cross)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700">
                Search
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              💡 Map integration coming soon - will show nearest clinics on interactive map
            </p>
          </div>
        </div>
      </section>

      {/* MAP PLACEHOLDER */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="bg-gray-100 rounded-lg h-[500px] flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">Interactive Map</h3>
              <p className="text-gray-500">
                Mapsi integration will go here<br/>
                (Leaflet + Mapsi tiles + 12 clinic markers)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic List */}
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
                  <button className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-emerald-700">
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