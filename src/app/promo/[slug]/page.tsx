/**
 * /promo/[slug] — a shareable campaign landing page.
 *
 * This is the page a Facebook or Viber post points at. Its job is narrow: make
 * the offer obvious above the fold, then capture the lead. There is no site
 * navigation on purpose — every link out of here is a person who did not fill
 * in the form, and someone who arrived from a social post has not asked to
 * browse a catalogue.
 *
 * `generateMetadata` is doing the real marketing work. Facebook, Messenger,
 * Viber and X all read the OpenGraph tags *once*, when the link is first
 * shared, and cache what they find — so the banner, title and one-liner have to
 * be right in the server-rendered HTML rather than filled in by the browser.
 * That is why this is a server component and the form is the only client part.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Footer } from '@/components/landing';
import { CampaignInquiryForm } from '@/components/campaigns';
import { getPublishedCampaignBySlug, recordCampaignView } from '@/lib/campaigns/repository';
import type { Campaign } from '@/types/campaign';

const baseUrl = 'https://www.easyridecebutours.com';

/**
 * Rendered per request, straight from Postgres — the same reason the tour and
 * fleet pages are. A promo is also the page most likely to be edited minutes
 * before it is posted, so a cached copy is a real risk here rather than a
 * theoretical one.
 */
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getPublishedCampaignBySlug(slug);

  if (!campaign) {
    return { title: 'Promo Not Found' };
  }

  const title = `${campaign.name} | EasyRideCebu`;
  const url = `${baseUrl}/promo/${slug}`;

  return {
    title,
    description: campaign.shortDescription,
    openGraph: {
      title: campaign.name,
      description: campaign.shortDescription,
      url,
      siteName: 'EasyRideCebu',
      images: [
        {
          url: campaign.bannerImage,
          width: 1200,
          height: 630,
          alt: campaign.name,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.name,
      description: campaign.shortDescription,
      images: [campaign.bannerImage],
    },
    alternates: {
      canonical: url,
    },
    /**
     * An expired promo is deliberately kept out of the index. The page still
     * serves — a link in an old post should explain itself — but a dead offer
     * ranking for "Cebu tour promo" wastes the click and the goodwill.
     */
    robots: campaign.hasEnded ? { index: false, follow: true } : undefined,
  };
}

/** Structured data, so the offer can surface as one in search results. */
function generateOfferSchema(campaign: Campaign) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: campaign.name,
    description: campaign.shortDescription,
    url: `${baseUrl}/promo/${campaign.slug}`,
    image: campaign.bannerImage,
    priceCurrency: 'PHP',
    availability: campaign.hasEnded
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock',
    ...(campaign.endsAt ? { validThrough: campaign.endsAt } : {}),
    seller: {
      '@type': 'TravelAgency',
      name: 'EasyRideCebu',
      url: baseUrl,
      telephone: '+639178046988',
    },
  };
}

export default async function CampaignPage({ params }: Props) {
  const { slug } = await params;
  const campaign = await getPublishedCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  // Awaited, not fired and forgotten: a floating promise in a server component
  // can be cut off when the response finishes, and a view counter that
  // sometimes counts is a number nobody can act on. It swallows its own errors,
  // so this cannot fail the page — it only costs one indexed UPDATE.
  await recordCampaignView(slug);

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOfferSchema(campaign)) }}
      />

      {/* A wordmark, not a nav bar. Someone landing from a Facebook ad needs to
          know whose offer this is; they do not need a menu. */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold text-slate-900">
            EasyRide<span className="text-coral">Cebu</span>
          </Link>
          <a
            href="https://wa.me/639178046988"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            <i className="pi pi-whatsapp" />
            <span className="hidden sm:inline">Chat with us</span>
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative aspect-[1200/630] w-full bg-slate-100">
            <Image
              src={campaign.bannerImage}
              alt={campaign.name}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              priority
            />
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {campaign.hasEnded && (
              <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                This offer has ended
              </span>
            )}

            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{campaign.name}</h1>
            <p className="mt-3 text-lg text-slate-600">{campaign.shortDescription}</p>

            {campaign.endsAt && !campaign.hasEnded && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-coral/10 px-3 py-2 text-sm font-medium text-coral-dark">
                <i className="pi pi-clock text-xs" />
                Offer ends{' '}
                {new Date(campaign.endsAt).toLocaleDateString('en-PH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {/* The details are HTML written in the portal's rich-text editor and
            sanitised on the way into the database (`sanitizeRichText`), so what
            is stored is already safe to render — rendering it as text would
            print the tags. `.rich-text` is the shared stylesheet the editor and
            the tour page both wear. */}
        {campaign.description && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-6 sm:px-8 sm:py-8">
            <div
              className="rich-text break-words text-slate-600"
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          </div>
        )}

        <div className="mt-6">
          <CampaignInquiryForm campaign={campaign} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
