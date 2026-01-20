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
import { TourInquiryForm, TourGallery } from '@/components/tours';
import toursData from '@/data/tours.json';
import type { Tour } from '@/types/tour';

const baseUrl = 'https://www.easyridecebutours.com';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all tours
export async function generateStaticParams() {
  const tours = toursData.tours as Tour[];
  return tours.map((tour) => ({ slug: tour.slug }));
}

// Generate metadata for each tour (SEO optimized)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tours = toursData.tours as Tour[];
  const tour = tours.find((t) => t.slug === slug);

  if (!tour) {
    return { title: 'Tour Not Found' };
  }

  // Extract destinations from itinerary for keywords
  const destinations = tour.itinerary
    .filter((item) => !item.time && !item.activity.toLowerCase().includes('pick'))
    .map((item) => item.activity)
    .slice(0, 5);

  // Build SEO-optimized title (50-60 chars)
  const title = `${tour.title} | Cebu Tour Package from ₱${tour.pricing.sedan.price.toLocaleString()}`;

  // Build SEO-optimized description (150-160 chars)
  const description = `Book ${tour.title} in Cebu. ${tour.duration} tour starting at ₱${tour.pricing.sedan.price.toLocaleString()}. Includes vehicle, driver & fuel. ${tour.shortDescription.slice(0, 60)}`;

  const url = `${baseUrl}/tours/${slug}`;

  return {
    title,
    description,
    keywords: [
      tour.title.toLowerCase(),
      `${tour.title.toLowerCase()} cebu`,
      `${tour.title.toLowerCase()} package`,
      'cebu tour package',
      'cebu day tour',
      'cebu tour with driver',
      ...destinations.map((d) => `${d.toLowerCase()} tour`),
      'affordable cebu tour',
      'cebu travel package',
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: 'EasyRideCebu',
      images: [
        {
          url: tour.image,
          width: 1200,
          height: 630,
          alt: `${tour.title} - Cebu Tour Package`,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [tour.image],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate TouristTrip structured data
function generateTourSchema(tour: Tour) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.description,
    url: `${baseUrl}/tours/${tour.slug}`,
    image: [tour.image, ...(tour.gallery || [])],
    touristType: 'Adventure travelers',
    itinerary: {
      '@type': 'ItemList',
      itemListElement: tour.itinerary.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'TouristAttraction',
          name: item.activity,
        },
      })),
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: tour.pricing.sedan.price,
      highPrice: tour.pricing.van.price,
      priceCurrency: 'PHP',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
      offerCount: 3,
    },
    provider: {
      '@type': 'TravelAgency',
      name: 'EasyRideCebu',
      url: baseUrl,
      telephone: '+639178046988',
    },
  };
}

// Generate Breadcrumb structured data
function generateBreadcrumbSchema(tour: Tour) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tours',
        item: `${baseUrl}/tours`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: tour.title,
        item: `${baseUrl}/tours/${tour.slug}`,
      },
    ],
  };
}

// Generate FAQ structured data specific to each tour
function generateFaqSchema(tour: Tour) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much does the ${tour.title} cost?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The ${tour.title} starts from ₱${tour.pricing.sedan.price.toLocaleString()} for sedan (${tour.pricing.sedan.capacity}), ₱${tour.pricing.suv.price.toLocaleString()} for SUV (${tour.pricing.suv.capacity}), and ₱${tour.pricing.van.price.toLocaleString()} for van (${tour.pricing.van.capacity}). All rates include vehicle, driver/guide, and fuel.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is included in the ${tour.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The ${tour.title} includes: ${tour.inclusions.join(', ')}. Not included: ${tour.exclusions.slice(0, 3).join(', ')}.`,
        },
      },
      {
        '@type': 'Question',
        name: `How long is the ${tour.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The ${tour.title} is a ${tour.duration} experience. ${tour.shortDescription}`,
        },
      },
    ],
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
    <main className="min-h-screen bg-slate-50 relative w-full max-w-full overflow-x-hidden">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateTourSchema(tour)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(tour)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFaqSchema(tour)),
        }}
      />

      {/* Background gradient overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-palm-light/5" />
      </div>

      <Navigation />

      {/* Hero with Image */}
      <section className="pt-16">
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
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="overflow-hidden">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Tour</h2>
                <p className="text-slate-600 leading-relaxed break-words">{tour.description}</p>
              </div>

              {/* Gallery Section */}
              {tour.gallery && tour.gallery.length > 0 && (
                <TourGallery images={tour.gallery} title={tour.title} />
              )}

              {/* Pricing Table */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Pricing</h2>
                <p className="text-sm text-slate-500 mb-4">All-inclusive rates with vehicle, driver/guide, and fuel</p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex-1 text-center p-3 sm:p-4 bg-cream rounded-xl hover:bg-coral/5 transition-colors flex flex-row sm:flex-col items-center sm:justify-center justify-between gap-2">
                    <div className="text-sm text-slate-500 sm:mb-1">Sedan</div>
                    <div className="flex items-baseline gap-2 sm:block">
                      <div className="text-lg sm:text-2xl font-bold text-slate-900">₱{tour.pricing.sedan.price.toLocaleString()}</div>
                      <div className="text-xs text-slate-400 sm:hidden">/ {tour.pricing.sedan.capacity}</div>
                    </div>
                    <div className="hidden sm:block text-xs text-slate-400">{tour.pricing.sedan.capacity}</div>
                  </div>
                  <div className="flex-1 text-center p-3 sm:p-4 bg-cream rounded-xl hover:bg-coral/5 transition-colors flex flex-row sm:flex-col items-center sm:justify-center justify-between gap-2">
                    <div className="text-sm text-slate-500 sm:mb-1">SUV</div>
                    <div className="flex items-baseline gap-2 sm:block">
                      <div className="text-lg sm:text-2xl font-bold text-slate-900">₱{tour.pricing.suv.price.toLocaleString()}</div>
                      <div className="text-xs text-slate-400 sm:hidden">/ {tour.pricing.suv.capacity}</div>
                    </div>
                    <div className="hidden sm:block text-xs text-slate-400">{tour.pricing.suv.capacity}</div>
                  </div>
                  <div className="flex-1 text-center p-3 sm:p-4 bg-cream rounded-xl hover:bg-coral/5 transition-colors flex flex-row sm:flex-col items-center sm:justify-center justify-between gap-2">
                    <div className="text-sm text-slate-500 sm:mb-1">Van</div>
                    <div className="flex items-baseline gap-2 sm:block">
                      <div className="text-lg sm:text-2xl font-bold text-slate-900">₱{tour.pricing.van.price.toLocaleString()}</div>
                      <div className="text-xs text-slate-400 sm:hidden">/ {tour.pricing.van.capacity}</div>
                    </div>
                    <div className="hidden sm:block text-xs text-slate-400">{tour.pricing.van.capacity}</div>
                  </div>
                </div>
              </div>

              {/* Itinerary */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Itinerary</h2>
                <ol className="space-y-4">
                  {tour.itinerary.map((item, idx) => (
                    <li key={idx} className="flex gap-4">
                      <span className="w-8 h-8 bg-gradient-to-br from-coral/20 to-mango/20 text-coral rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="pt-1 min-w-0 flex-1">
                        {item.time && (
                          <span className="text-sm text-coral font-medium">{item.time} &mdash; </span>
                        )}
                        <span className="text-slate-700 break-words">{item.activity}</span>
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
