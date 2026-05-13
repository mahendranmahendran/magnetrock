// app/services/page.tsx - Services Page
import Link from 'next/link';
import { Header, Footer } from '../page';

export default function ServicesPage() {
  const services = [
    {
      icon: '💉',
      title: 'Vaccinations',
      description: 'Keep your pet protected with our comprehensive vaccination programs',
      price: 'From £45'
    },
    {
      icon: '🔬',
      title: 'Health Checks',
      description: 'Regular check-ups to catch issues early and keep pets healthy',
      price: 'From £35'
    },
    {
      icon: '🦷',
      title: 'Dental Care',
      description: 'Professional cleaning and dental treatments for healthy teeth',
      price: 'From £120'
    },
    {
      icon: '🏥',
      title: 'Surgery',
      description: 'Safe surgical procedures with experienced veterinary surgeons',
      price: 'Consultation required'
    },
    {
      icon: '🔬',
      title: 'Diagnostics',
      description: 'Blood tests, X-rays, and ultrasounds available at all locations',
      price: 'From £60'
    },
    {
      icon: '🚑',
      title: 'Emergency Care',
      description: '24/7 emergency services at our central London clinic',
      price: '24/7 availability'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="services" />

      {/* Page Header */}
      <section className="bg-emerald-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive veterinary care for cats, dogs, and small pets
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="text-emerald-600 font-semibold">{service.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-700 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Book?</h3>
          <p className="text-xl text-emerald-100 mb-6">
            Find your nearest clinic and schedule an appointment today
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/locations" 
              className="bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition"
            >
              Find Clinic
            </Link>
            <Link 
              href="/booking" 
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold border-2 border-white hover:bg-emerald-800 transition"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}