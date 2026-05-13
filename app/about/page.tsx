// app/about/page.tsx - About Us
import Link from 'next/link';
import { Header, Footer } from '../page';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="about" />

      {/* Page Header */}
      <section className="bg-emerald-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">About PawCare</h2>
          <p className="text-xl text-gray-600">
            London's trusted veterinary clinic chain since 2015
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-lg max-w-none">
            <h3 className="text-2xl font-bold mb-4">Our Story</h3>
            <p className="text-gray-600 mb-4">
              PawCare London started in 2015 with a single clinic in Camden. Our founders, 
              Dr. Sarah Mitchell and Dr. James Cooper, wanted to create a veterinary practice 
              that truly put pets and their owners first.
            </p>
            <p className="text-gray-600 mb-4">
              Today, we operate 12 clinics across London, serving over 15,000 pets every month. 
              Our team of 50+ experienced veterinarians provides everything from routine check-ups 
              to emergency surgery.
            </p>

            <h3 className="text-2xl font-bold mb-4 mt-8">Our Values</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Compassionate care for every pet</li>
              <li>✓ Transparent pricing with no hidden fees</li>
              <li>✓ Modern facilities and equipment</li>
              <li>✓ Convenient locations across London</li>
              <li>✓ 24/7 emergency care available</li>
            </ul>
          </div>
        </div>
      </section>

      {/* DEMO DISCLAIMER */}
      <section className="py-12 bg-yellow-50 border-t-4 border-b-4 border-yellow-400">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
              <span>⚠️</span>
              Portfolio Demonstration Website
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>PawCare London is a fictional veterinary clinic</strong> created for 
                portfolio and demonstration purposes.
              </p>
              <p>
                This website showcases integration capabilities with Mapsi (open-source maps API):
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Clinic locator with interactive map (Mapsi Tiles + Leaflet.js)</li>
                <li>Address autocomplete (Mapsi Geocoding API)</li>
                <li>Home visit coverage validation (Turf.js + GeoJSON zones)</li>
              </ul>
              <p className="mt-4">
                <strong>Location: London, UK</strong> was chosen for excellent OpenStreetMap 
                coverage, ensuring flawless address resolution in demos.
              </p>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="font-semibold">Need similar map integration for your business?</p>
                <p className="text-sm text-gray-600 mt-1">
                  📧 your-email@example.com<br/>
                  🌐 Built with: Next.js 14, Mapsi API, Leaflet.js, Turf.js
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}