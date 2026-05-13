// app/page.tsx - Homepage + Shared Components
import Link from 'next/link';

// ============================================
// SHARED COMPONENTS (exported for other pages)
// ============================================

export function Header({ currentPage }: { currentPage?: string }) {
  return (
    <header className="bg-emerald-700 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-4xl">🐾</div>
            <div>
              <h1 className="text-2xl font-bold">PawCare London</h1>
              <p className="text-sm text-emerald-100">Compassionate Veterinary Care</p>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link 
              href="/" 
              className={currentPage === 'home' ? 'text-emerald-200 font-semibold' : 'hover:text-emerald-200'}
            >
              Home
            </Link>
            <Link 
              href="/services" 
              className={currentPage === 'services' ? 'text-emerald-200 font-semibold' : 'hover:text-emerald-200'}
            >
              Services
            </Link>
            <Link 
              href="/locations" 
              className={currentPage === 'locations' ? 'text-emerald-200 font-semibold' : 'hover:text-emerald-200'}
            >
              Locations
            </Link>
            <Link 
              href="/booking" 
              className={currentPage === 'booking' ? 'text-emerald-200 font-semibold' : 'hover:text-emerald-200'}
            >
              Book
            </Link>
            <Link 
              href="/about" 
              className={currentPage === 'about' ? 'text-emerald-200 font-semibold' : 'hover:text-emerald-200'}
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400">© 2025 PawCare London. All rights reserved.</p>
        <p className="text-sm text-gray-500 mt-2">
          Registered Veterinary Practice #VET123456
        </p>
      </div>
    </footer>
  );
}

// ============================================
// HOMEPAGE CONTENT
// ============================================

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="home" />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Expert Care for Your Pets
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            12 veterinary clinics across London. Same-day appointments available.
            Your trusted partner in pet health since 2015.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/locations" 
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              Find Nearest Clinic
            </Link>
            <Link 
              href="/booking" 
              className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold border-2 border-emerald-600 hover:bg-emerald-50 transition"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-emerald-600">12</div>
              <div className="text-gray-600 mt-2">Clinics Across London</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600">50+</div>
              <div className="text-gray-600 mt-2">Experienced Vets</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600">24/7</div>
              <div className="text-gray-600 mt-2">Emergency Care</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600">15k+</div>
              <div className="text-gray-600 mt-2">Pets Treated Monthly</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-emerald-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose PawCare?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🏥</div>
              <h4 className="text-xl font-semibold mb-2">Modern Facilities</h4>
              <p className="text-gray-600">
                State-of-the-art equipment and treatment rooms at every clinic
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">📍</div>
              <h4 className="text-xl font-semibold mb-2">Convenient Locations</h4>
              <p className="text-gray-600">
                12 clinics across London - always one near you
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">💚</div>
              <h4 className="text-xl font-semibold mb-2">Compassionate Care</h4>
              <p className="text-gray-600">
                We treat every pet like family, with patience and kindness
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}