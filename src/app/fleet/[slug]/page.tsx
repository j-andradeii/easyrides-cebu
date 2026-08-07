/**
 * Vehicle Detail Page
 *
 * Where "Book Now" on the landing page's fleet grid lands: the car big enough
 * to look at, the gallery for the angles the card cannot show, what it seats
 * and carries, the day rate, and the form that turns all of that into a lead —
 * including how many days they want it and where to hand the car over.
 *
 * Laid out top to bottom rather than as a sidebar: photo and gallery, then the
 * details side by side, then the booking form as a full-width section of its
 * own. A rental form asks for six things, and a squeezed column made every one
 * of them a full-width row a visitor had to scroll through.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/landing';
import { VehicleInquiryForm } from '@/components/fleet';
import { PhotoGallery } from '@/components/PhotoGallery';
import { VEHICLE_GALLERY_MAX } from '@/models/vehicle.schema';
import { getPublishedVehicleBySlug, getPublishedVehicles } from '@/lib/vehicles/repository';
import type { Vehicle } from '@/types/vehicle';

const baseUrl = 'https://www.easyridecebutours.com';

/**
 * Rendered per request, straight from Postgres — see the note in `app/page.tsx`.
 * A build box with no database credentials would otherwise bake an empty fleet
 * into these pages and serve it until the next deploy.
 */
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

/** "Sedan · Vios / Mirage G4 (AT)" — the way the car is named throughout. */
function vehicleName(vehicle: Vehicle): string {
  return `${vehicle.type} · ${vehicle.models}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getPublishedVehicleBySlug(slug);

  if (!vehicle) {
    return { title: 'Vehicle Not Found' };
  }

  const rate = vehicle.rate.toLocaleString();
  const title = `Rent a ${vehicle.type} in Cebu — ${vehicle.models} from ₱${rate}/day`;
  const description = `${vehicle.models} for rent in Cebu at ₱${rate} per 24 hours. ${vehicle.capacity}, ${vehicle.features.slice(0, 3).join(', ')}. Self-drive or with a driver — book online, no payment needed to reserve.`;
  const url = `${baseUrl}/fleet/${slug}`;

  return {
    title,
    description,
    keywords: [
      `${vehicle.type.toLowerCase()} rental cebu`,
      `rent ${vehicle.type.toLowerCase()} cebu`,
      `cheap ${vehicle.type.toLowerCase()} rental cebu`,
      'cebu car rental',
      'car rental cebu city',
      'cebu car rental with driver',
      'self drive car rental cebu',
      'mactan airport car rental',
      ...vehicle.models
        .split(/[/,]/)
        .map((model) => `${model.trim().toLowerCase()} rental cebu`)
        .filter((keyword) => keyword.length > 15),
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: 'EasyRideCebu',
      images: [
        {
          url: vehicle.image,
          width: 1200,
          height: 630,
          alt: `${vehicle.models} — ${vehicle.type} car rental in Cebu`,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [vehicle.image],
    },
    alternates: {
      canonical: url,
    },
  };
}

/** schema.org Car — the rate is per day, which `unitCode DAY` is how you say. */
function generateVehicleSchema(vehicle: Vehicle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${vehicle.models} (${vehicle.type})`,
    description: `${vehicle.type} car rental in Cebu — ${vehicle.capacity}. ${vehicle.features.join(', ')}.`,
    url: `${baseUrl}/fleet/${vehicle.slug}`,
    // Every photo we have of the car, headline shot first — the same list the
    // tour schema publishes.
    image: [vehicle.image, ...(vehicle.gallery ?? [])],
    vehicleConfiguration: vehicle.type,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PHP',
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: vehicle.rate,
        priceCurrency: 'PHP',
        unitCode: 'DAY',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitCode: 'DAY',
        },
      },
      seller: {
        '@type': 'AutoRental',
        name: 'EasyRideCebu',
        url: baseUrl,
        telephone: '+639178046988',
        areaServed: 'Cebu, Philippines',
      },
    },
  };
}

function generateBreadcrumbSchema(vehicle: Vehicle) {
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
        name: 'Fleet',
        item: `${baseUrl}/#fleet`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: vehicleName(vehicle),
        item: `${baseUrl}/fleet/${vehicle.slug}`,
      },
    ],
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const { slug } = await params;
  const vehicle = await getPublishedVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  // The rest of the fleet, for the visitor whose group turned out to be bigger
  // than this car. Never fails the page — `getPublishedVehicles` swallows.
  const fleet = await getPublishedVehicles();
  const others = fleet.filter((other) => other.slug !== vehicle.slug);

  // Blank URLs would render as broken tiles; the column is only as clean as
  // whatever was in the row before the editor last saved it.
  const gallery = (vehicle.gallery ?? []).filter(Boolean);

  return (
    <main className="min-h-screen bg-white relative w-full max-w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateVehicleSchema(vehicle)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(vehicle)) }}
      />

      <Navigation />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      {/* The photo is a cut-out on white, so it is shown whole rather than
          cropped to a banner the way a tour's landscape shot is. */}
      <section className="pt-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-cream-light to-cream">
          {/* Warm decorative blob — coral tone only, no blue */}
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--sunset-orange) 0%, var(--cebu-red) 60%, transparent 80%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--papaya) 0%, transparent 70%)' }}
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link href="/" className="transition-colors hover:text-coral">
                Home
              </Link>
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/#fleet" className="transition-colors hover:text-coral">
                Fleet
              </Link>
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium text-slate-600">{vehicle.models}</span>
            </nav>

            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Car image */}
              <div className="relative flex items-center justify-center">
                {vehicle.popular && (
                  <div className="absolute left-0 top-0 z-20">
                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-coral to-mango px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-coral/20">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      MOST POPULAR
                    </div>
                  </div>
                )}
                {/* Warm glow behind car */}
                <div
                  className="absolute inset-0 rounded-full opacity-20 blur-2xl"
                  style={{ background: 'radial-gradient(circle at center, var(--sunset-orange) 0%, transparent 65%)' }}
                />
                <div className="relative h-64 w-full sm:h-80 lg:h-[420px]">
                  <Image
                    src={vehicle.image}
                    alt={`${vehicle.models} — ${vehicle.type} for rent in Cebu`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain drop-shadow-xl"
                    priority
                  />
                </div>
              </div>

              {/* Info panel */}
              <div className="flex flex-col gap-5">
                {/* Type + capacity pill */}
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-coral/20 bg-coral/5 px-4 py-1.5 text-sm font-semibold text-terracotta">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  {vehicle.type} · {vehicle.capacity}
                </span>

                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    {vehicle.models}
                  </h1>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    Rent a {vehicle.type.toLowerCase()} in Cebu with the paperwork done in a chat.
                    Airport, hotel or Airbnb delivery, fuel-efficient and freshly serviced — drive it
                    yourself or add one of our professional drivers.
                  </p>
                </div>

                {/* Price block */}
                <div className="rounded-2xl border border-slate-300 bg-white px-6 py-5 shadow-sm">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Daily rate
                  </p>
                  <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                    <span className="text-5xl font-bold text-slate-900">
                      ₱{vehicle.rate.toLocaleString()}
                    </span>
                    <div className="mb-1 flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-slate-500 line-through decoration-slate-400 decoration-2">
                        ₱{(vehicle.rate * 1.2).toLocaleString()}
                      </span>
                      <span className="text-sm font-medium text-slate-600">/ 24 hours</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    No payment needed to reserve · Free delivery within Cebu City
                  </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#book"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-coral to-mango px-7 py-3.5 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:-translate-y-0.5 hover:from-coral-dark hover:to-mango-dark hover:shadow-xl active:translate-y-0"
                  >
                    Check availability
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>

                  <a
                    href={`https://wa.me/639178046988?text=Hi! I'm interested in renting the ${encodeURIComponent(vehicle.models)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-green-400 hover:bg-green-50 hover:text-green-700 hover:shadow-md active:translate-y-0"
                  >
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path fillRule="evenodd" d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.534 5.856L.057 23.57a.5.5 0 00.612.612l5.714-1.477A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" clipRule="evenodd" />
                    </svg>
                    WhatsApp us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── TRUST BADGES ─────────────────────────────────────────────────── */}
      <section className="border-y border-slate-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
            {[
              { icon: '🛡️', label: 'Full Insurance', sub: 'Comprehensive cover' },
              { icon: '🚗', label: 'Free Delivery', sub: 'Cebu City area' },
              { icon: '📞', label: '24/7 Support', sub: 'Always reachable' },
              { icon: '💳', label: 'No Deposit', sub: 'Reserve for free' },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-3 px-6 py-4">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{badge.label}</p>
                  <p className="text-xs text-slate-500">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────────────── */}
      {/* Only the cars an editor has photographed beyond the card shot get
          this, so a fleet imported before the column existed simply skips it. */}
      {gallery.length > 0 && (
        <section className="py-10" style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--cream-light) 100%)' }}>
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-coral to-mango" />
              <h2 className="text-lg font-bold text-slate-900">Photos of this vehicle</h2>
            </div>
            <PhotoGallery
              images={gallery}
              title={`${vehicle.models} — ${vehicle.type} rental in Cebu`}
              heading=""
              maxVisible={VEHICLE_GALLERY_MAX}
            />
          </div>
        </section>
      )}

      {/* ── FEATURES + INCLUSIONS ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-5">

            {/* What you get */}
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-300 px-6 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-coral to-mango">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h2 className="font-bold text-slate-900">What you get</h2>
              </div>
              <ul className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {vehicle.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-800">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        vehicle.popular ? 'bg-coral/10 text-coral' : 'bg-palm-light/10 text-palm'
                      }`}
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Included / Good to know */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Included */}
              <div className="rounded-2xl border border-green-300 bg-green-50 p-6">
                <h3 className="mb-4 flex items-center gap-2.5 font-bold text-green-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Included
                </h3>
                <ul className="space-y-2.5">
                  {[
                    'Comprehensive insurance',
                    'Free delivery within Cebu City',
                    '24/7 roadside support',
                    'Flexible pickup and drop-off',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-green-800">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Good to know */}
              <div className="rounded-2xl border border-slate-300 bg-slate-100 p-6">
                <h3 className="mb-4 flex items-center gap-2.5 font-bold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Good to know
                </h3>
                <ul className="space-y-2.5">
                  {[
                    "Driver's licence and one valid ID at pickup",
                    'Fuel is not included — return it as you got it',
                    'Driver service available as an add-on',
                    'Airport pickup can be arranged',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOKING ──────────────────────────────────────────────────────── */}
      {/* A section of its own across the full width, which is what lets the
          form lay its six fields out in columns instead of a column. */}
      <section
        id="book"
        className="scroll-mt-24 border-t border-slate-300 py-14"
        style={{ background: 'linear-gradient(180deg, #FDF6EE 0%, var(--cream-light) 40%, #FDF6EE 100%)' }}
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-coral/40 bg-coral/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-coral">
              📅 Book Now
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Check availability for the {vehicle.models}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-slate-600">
              Tell us your dates and where to meet you — we confirm the car and send the total.
              Free delivery within Cebu City, and no payment is needed to reserve.
            </p>
          </div>

          <VehicleInquiryForm vehicle={vehicle} />
        </div>
      </section>

      {/* ── ALSO IN THE FLEET ────────────────────────────────────────────── */}
      {/* Placed after the booking form so the visitor who chose a different
          car can browse without losing the booking CTA above the fold. */}
      {others.length > 0 && (
        <section className="border-t border-slate-300 bg-cream-light py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-1 w-8 rounded-full bg-gradient-to-r from-coral to-mango" />
                <h2 className="text-xl font-bold text-slate-900">Also in the fleet</h2>
              </div>
              <Link
                href="/#fleet"
                className="hidden items-center gap-1.5 text-sm font-medium text-coral transition-colors hover:text-coral-dark sm:flex"
              >
                View all
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Three across on a wide screen */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={`/fleet/${other.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-coral/50 hover:shadow-lg"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-cream">
                    <Image
                      src={other.image}
                      alt={other.models}
                      fill
                      sizes="96px"
                      className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 transition-colors group-hover:text-coral">
                      {other.type}
                    </p>
                    <p className="truncate text-sm font-medium text-slate-600">{other.models}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-bold text-coral">₱{other.rate.toLocaleString()}</span>
                      <span className="font-medium text-slate-500"> / day</span>
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-coral"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BACK LINK ────────────────────────────────────────────────────── */}
      <section className="border-t border-slate-300 bg-white py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/#fleet"
            className="inline-flex items-center gap-2 font-medium text-coral transition-colors hover:text-coral-dark"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to the fleet
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
