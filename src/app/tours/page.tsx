/**
 * Tours Listing Page
 *
 * Displays all available tour packages
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/landing';
import { TourCard } from '@/components/tours';
import toursData from '@/data/tours.json';
import type { Tour } from '@/types/tour';

export const metadata: Metadata = {
  title: 'Tour Packages - EasyRideCebu',
  description: 'Explore our curated Cebu tour packages with all-inclusive transportation. City tours, safari adventures, canyoneering, and more.',
};

export default function ToursPage() {
  const tours = toursData.tours as Tour[];

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-palm-light/5" />

      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative">
        {/* Background decoration */}
        <div className="absolute top-20 left-0 w-72 h-72 bg-palm-light/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-mango/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white text-palm-dark px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-sm border border-palm-light/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Tour Packages
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Discover <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">Cebu Adventures</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            All packages include vehicle, driver/guide, and fuel. Choose the perfect adventure for your Cebu trip.
          </p>

          {/* Breadcrumb */}
          <div className="mt-8">
            <nav className="flex justify-center items-center gap-2 text-sm text-slate-500">
              <Link href="/" className="hover:text-coral transition-colors">
                Home
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-slate-900 font-medium">Tours</span>
            </nav>
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <TourCard key={tour.slug} tour={tour} />
            ))}
          </div>

          {/* Info Banner */}
          <div className="mt-16 bg-gradient-to-r from-coral/10 to-mango/10 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Can&apos;t Find What You&apos;re Looking For?</h3>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto">
              We offer custom tour packages tailored to your preferences. Contact us to create your perfect Cebu adventure.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl"
            >
              Request Custom Tour
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
