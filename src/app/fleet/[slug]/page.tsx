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
    <main className="min-h-screen bg-slate-50 relative w-full max-w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateVehicleSchema(vehicle)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(vehicle)) }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-palm-light/5" />
      </div>

      <Navigation />

      {/* Hero — the photo is a cut-out on white, so it is shown whole rather
          than cropped to a banner the way a tour's landscape shot is. */}
      <section className="pt-16">
        <div className="relative bg-gradient-to-br from-white via-cream-light to-cream">
          <div className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
            <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link href="/" className="transition-colors hover:text-coral">
                Home
              </Link>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/#fleet" className="transition-colors hover:text-coral">
                Fleet
              </Link>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-slate-700">{vehicle.models}</span>
            </nav>

            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="relative h-64 sm:h-80 lg:h-96">
                {vehicle.popular && (
                  <div className="absolute left-0 top-0 z-20">
                    <div className="rounded-full bg-gradient-to-r from-coral to-mango px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-coral/20">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                <Image
                  src={vehicle.image}
                  alt={`${vehicle.models} — ${vehicle.type} for rent in Cebu`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain"
                  priority
                />
              </div>

              <div>
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-terracotta shadow-sm">
                  {vehicle.type} · {vehicle.capacity}
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {vehicle.models}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  Rent a {vehicle.type.toLowerCase()} in Cebu with the paperwork done in a chat.
                  Airport, hotel or Airbnb delivery, fuel-efficient and freshly serviced — drive it
                  yourself or add one of our professional drivers.
                </p>

                <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-4xl font-bold text-slate-900">
                    ₱{vehicle.rate.toLocaleString()}
                  </span>
                  <span className="mb-1.5 text-sm font-medium text-slate-400 line-through decoration-slate-300 decoration-2 opacity-60">
                    ₱{(vehicle.rate * 1.2).toLocaleString()}
                  </span>
                  <span className="mb-1.5 text-sm text-slate-500">/ 24 hours</span>
                </div>

                {/* Shown at every width now: the form sits at the foot of the
                    page rather than beside this, so there is always somewhere
                    to jump to. */}
                <a
                  href="#book"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-coral to-mango px-8 py-4 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:-translate-y-0.5 hover:from-coral-dark hover:to-mango-dark hover:shadow-xl"
                >
                  Check availability
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery — only the cars an editor has photographed beyond the card
          shot get this, so a fleet imported before the column existed simply
          skips it. */}
      {gallery.length > 0 && (
        <section className="pt-8">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <PhotoGallery
              images={gallery}
              title={`${vehicle.models} — ${vehicle.type} rental in Cebu`}
              heading="Photos of this vehicle"
              maxVisible={VEHICLE_GALLERY_MAX}
            />
          </div>
        </section>
      )}

      {/* Detail */}
      <section className="relative overflow-hidden py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-slate-900">What you get</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {vehicle.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-700">
                    <span
                      className={`rounded-full p-1 ${vehicle.popular ? 'bg-coral/10 text-coral' : 'bg-palm-light/10 text-palm'}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-green-50 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-green-800">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Included
                </h3>
                <ul className="space-y-2 text-green-700">
                  {['Comprehensive insurance', 'Free delivery within Cebu City', '24/7 roadside support', 'Flexible pickup and drop-off'].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-slate-100 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Good to know
                </h3>
                <ul className="space-y-2 text-slate-700">
                  {["Driver's licence and one valid ID at pickup", 'Fuel is not included — return it as you got it', 'Driver service available as an add-on', 'Airport pickup can be arranged'].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {others.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-slate-900">Also in the fleet</h2>
                {/* Three across on a wide screen — the row used to be half the
                    page, so two was all that fitted. */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((other) => (
                    <Link
                      key={other.slug}
                      href={`/fleet/${other.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-coral/40 hover:shadow-lg"
                    >
                      <div className="relative h-16 w-24 shrink-0">
                        <Image
                          src={other.image}
                          alt={other.models}
                          fill
                          sizes="96px"
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 transition-colors group-hover:text-coral">
                          {other.type}
                        </p>
                        <p className="truncate text-sm text-slate-500">{other.models}</p>
                        <p className="text-sm font-medium text-slate-700">
                          ₱{other.rate.toLocaleString()} / day
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Booking — a section of its own across the full width, which is what
          lets the form lay its six fields out in columns instead of a column. */}
      <section
        id="book"
        className="scroll-mt-24 border-t border-slate-200 bg-gradient-to-b from-cream-light via-white to-cream-light py-8"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center md:mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
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

      <section className="py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/#fleet"
            className="inline-flex items-center gap-2 font-medium text-coral transition-colors hover:text-coral-dark"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
