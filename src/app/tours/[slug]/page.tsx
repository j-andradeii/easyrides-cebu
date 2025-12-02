/**
 * Tour Detail Page
 *
 * Displays full tour information with itinerary and inquiry form
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/landing';
import { TourInquiryForm } from '@/components/tours';
import toursData from '@/data/tours.json';
import type { Tour } from '@/types/tour';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all tours
export async function generateStaticParams() {
  const tours = toursData.tours as Tour[];
  return tours.map((tour) => ({ slug: tour.slug }));
}

// Generate metadata for each tour
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tours = toursData.tours as Tour[];
  const tour = tours.find((t) => t.slug === slug);

  if (!tour) {
    return { title: 'Tour Not Found - EasyRideCebu' };
  }

  return {
    title: `${tour.title} - EasyRideCebu`,
    description: tour.description,
  };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params;
  const tours = toursData.tours as Tour[];
  const tour = tours.find((t) => t.slug === slug);

  if (!tour) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero with Image */}
      <section className="pt-24">
        <div className="relative h-[400px] md:h-[500px]">
          <Image
            src={tour.image}
            alt={tour.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-white/70 mb-4">
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link href="/tours" className="hover:text-white transition-colors">
                  Tours
                </Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-white">{tour.title}</span>
              </nav>

              <span className="inline-block bg-coral text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                {tour.duration}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white">{tour.title}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Tour</h2>
                <p className="text-slate-600 leading-relaxed">{tour.description}</p>
              </div>

              {/* Pricing Table */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Pricing</h2>
                <p className="text-sm text-slate-500 mb-4">All-inclusive rates with vehicle, driver/guide, and fuel</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl hover:bg-coral/5 transition-colors">
                    <div className="text-sm text-slate-500 mb-1">Sedan</div>
                    <div className="text-2xl font-bold text-slate-900">₱{tour.pricing.sedan.price.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{tour.pricing.sedan.capacity}</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl hover:bg-coral/5 transition-colors">
                    <div className="text-sm text-slate-500 mb-1">SUV</div>
                    <div className="text-2xl font-bold text-slate-900">₱{tour.pricing.suv.price.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{tour.pricing.suv.capacity}</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl hover:bg-coral/5 transition-colors">
                    <div className="text-sm text-slate-500 mb-1">Van</div>
                    <div className="text-2xl font-bold text-slate-900">₱{tour.pricing.van.price.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{tour.pricing.van.capacity}</div>
                  </div>
                </div>
              </div>

              {/* Itinerary */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Itinerary</h2>
                <ol className="space-y-4">
                  {tour.itinerary.map((item, idx) => (
                    <li key={idx} className="flex gap-4">
                      <span className="w-8 h-8 bg-gradient-to-br from-coral/20 to-mango/20 text-coral rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="pt-1">
                        {item.time && (
                          <span className="text-sm text-coral font-medium">{item.time} &mdash; </span>
                        )}
                        <span className="text-slate-700">{item.activity}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Inclusions/Exclusions */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-2xl p-6">
                  <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Inclusions
                  </h3>
                  <ul className="space-y-2">
                    {tour.inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-700">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-2xl p-6">
                  <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Exclusions
                  </h3>
                  <ul className="space-y-2">
                    {tour.exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-red-700">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Back to Tours Link */}
              <div className="pt-4">
                <Link
                  href="/tours"
                  className="inline-flex items-center gap-2 text-coral hover:text-coral-dark font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to All Tours
                </Link>
              </div>
            </div>

            {/* Sidebar - Contact Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <TourInquiryForm tourTitle={tour.title} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
