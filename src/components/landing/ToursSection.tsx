/**
 * ToursSection Component
 *
 * Displays featured tour packages on the landing page
 */

import Link from 'next/link';
import { TourCard } from '@/components/tours';
import toursData from '@/data/tours.json';
import type { Tour } from '@/types/tour';

export function ToursSection() {
  const tours = toursData.tours as Tour[];
  const featuredTours = tours.filter((tour) => tour.featured).slice(0, 3);

  return (
    <section id="tours" className="py-12 bg-white relative overflow-hidden scroll-mt-15 border-t border-cream-dark/50">
      {/* Background decoration */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-palm-light/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-80 h-80 bg-mango/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Explore <span className="bg-gradient-to-r from-mango to-coral bg-clip-text text-transparent">Cebu Adventures</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover the best of Cebu with our curated tour packages. All-inclusive transportation
            with professional driver/guide.
          </p>
        </div>

        {/* Tour Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {featuredTours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>

        {/* Show More Button */}
        <div className="text-center mt-12">
          <Link
            href="/tours"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl hover:-translate-y-0.5"
          >
            Show More Tours
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
