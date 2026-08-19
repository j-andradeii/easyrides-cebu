/**
 * /promo/[slug] — a shareable campaign landing page.
 *
 * This is the page a Facebook or Viber post points at. Its job is narrow: make
 * the offer obvious above the fold, then capture the lead. There is no site
 * navigation on purpose — every link out of here is a person who did not fill
 * in the form, and someone who arrived from a social post has not asked to
 * browse a catalogue.
 *
 * The banner sits *beside* the promise rather than above it. At full width a
 * 1200×630 image is over 500px of hero before a single word of the offer, which
 * on a laptop pushed the headline, the deadline and the button under the fold —
 * so the one thing the visitor came to read arrived last. Narrowed to a column
 * it still does its job (recognition: this is the picture from the feed) at a
 * third of the height, and the headline, the countdown and the call to action
 * fit on the first screen with it.
 *
 * `generateMetadata` is doing the real marketing work. Facebook, Messenger,
 * Viber and X all read the OpenGraph tags *once*, when the link is first
 * shared, and cache what they find — so the banner, title and one-liner have to
 * be right in the server-rendered HTML rather than filled in by the browser.
 * That is why this is a server component and the form is the only client part.
 */

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Footer } from '@/components/landing';
import { CampaignInquiryForm } from '@/components/campaigns';
import { getPublishedCampaignBySlug, recordCampaignView } from '@/lib/campaigns/repository';
import { serviceLabel, vehicleLabel } from '@/lib/crm/normalize';
import { getPublishedTestimonials } from '@/lib/crm/testimonials';
import type { Campaign } from '@/types/campaign';

const baseUrl = 'https://www.easyridecebutours.com';

/**
 * The landing page's friction-reducer, condensed to one line each.
 *
 * It sits directly above the form rather than further up, because the objection
 * it answers — "what actually happens if I hand over my number?" — is the one a
 * visitor has at the moment they are looking at the first empty field.
 */
const STEPS = [
  {
    icon: 'pi-pencil',
    title: 'Tell us your plan',
    text: 'Your dates and a contact number. Under a minute — no account, no card.',
  },
  {
    icon: 'pi-bolt',
    title: 'Get a fast quote',
    text: 'We confirm availability and send a clear, fixed price to your chat.',
  },
  {
    icon: 'pi-car',
    title: 'Sit back & ride',
    text: 'A clean, air-conditioned vehicle arrives on time. Enjoy Cebu.',
  },
];

/**
 * How much of the offer is left, as a phrase rather than a date.
 *
 * Only ever runs on a live offer (`hasEnded` is server-computed), and the page
 * is `force-dynamic`, so this is never a cached number counting down from a
 * build. Anything past a fortnight returns null: "43 days left" is not urgency,
 * it is trivia, and printing it weakens the badge for the promos that mean it.
 */
function timeLeftLabel(endsAt: string): string | null {
  const msLeft = new Date(endsAt).getTime() - Date.now();
  if (msLeft <= 0) return null;

  const days = Math.ceil(msLeft / 86_400_000);
  if (days <= 1) return 'Last day';
  return days <= 14 ? `${days} days left` : null;
}

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
      /**
       * No declared width/height. They are only a hint for the first scrape,
       * before the crawler has fetched the picture and measured it — and a
       * banner is whatever shape the designer drew, so hard-coding 1200 × 630
       * described most of them wrongly. A crawler that measures the real file
       * is better served by being told nothing than by being told that.
       */
      images: [{ url: campaign.bannerImage, alt: campaign.name }],
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

  // The view count is awaited, not fired and forgotten: a floating promise in a
  // server component can be cut off when the response finishes, and a counter
  // that sometimes counts is a number nobody can act on. It swallows its own
  // errors, so this cannot fail the page — it only costs one indexed UPDATE.
  //
  // Paired with the review read because neither needs the other's answer — the
  // same `Promise.all` the landing page uses for its portal-owned content. That
  // reader never throws either; an unreachable database costs the quote, not
  // the promo.
  const [, testimonials] = await Promise.all([
    recordCampaignView(slug),
    getPublishedTestimonials(1),
  ]);
  const review = testimonials[0] ?? null;

  const deadline = campaign.endsAt
    ? new Date(campaign.endsAt).toLocaleDateString('en-PH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  // The hero badge only speaks for a live offer; the summary below states the
  // date either way, because "valid until <a date last month>" is the answer
  // someone arriving from an old post actually needs.
  const endsOn = campaign.hasEnded ? null : deadline;
  const timeLeft = campaign.endsAt && !campaign.hasEnded ? timeLeftLabel(campaign.endsAt) : null;

  /**
   * The coupon-style "offer details" box — and the only place a visitor ever
   * sees the campaign's service and vehicle pre-selection. Both already drive
   * the form's defaults; saying them out loud is what makes a promo read as a
   * specific deal rather than a generic contact page with a picture on it.
   */
  const glance = [
    {
      icon: 'pi-tag',
      label: 'Applies to',
      value: campaign.serviceType ? serviceLabel(campaign.serviceType) : 'Any service',
    },
    {
      icon: 'pi-car',
      label: 'Vehicle',
      value: vehicleLabel(campaign.vehicleType) ?? 'Your choice',
    },
    { icon: 'pi-calendar', label: 'Valid until', value: deadline ?? 'While it lasts' },
    { icon: 'pi-credit-card', label: 'To reserve', value: 'No card needed' },
  ];

  /**
   * The bands below the hero, tinted alternately.
   *
   * Two only. The offer summary moved up beside the banner and the three steps
   * now sit on top of the form they explain: each band costs its own padding
   * and its own border, and four of them for this much content left the page
   * mostly gutter. Still a list rather than written out, because the details
   * band comes and goes and hard-coded tints would put two of the same colour
   * side by side the moment it is absent.
   */
  const bands: Array<{ key: string; content: ReactNode }> = [
    // The details are HTML written in the portal's rich-text editor and
    // sanitised on the way into the database (`sanitizeRichText`), so what is
    // stored is already safe to render — rendering it as text would print the
    // tags. `.rich-text` is the shared stylesheet the editor and the tour page
    // both wear.
    ...(campaign.description
      ? [
          {
            key: 'details',
            content: (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  What&apos;s in this offer
                </h2>
                <div
                  className="rich-text break-words text-slate-600"
                  dangerouslySetInnerHTML={{ __html: campaign.description }}
                />
              </div>
            ),
          },
        ]
      : []),

    {
      key: 'claim',
      content: (
        <div id="claim" className="scroll-mt-6">
          <CampaignInquiryForm campaign={campaign} />
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOfferSchema(campaign)) }}
      />

      {/* A deadline is the one thing worth saying before the offer itself — but
          only while it is close enough to mean anything. `timeLeftLabel` returns
          null past a fortnight, which is what keeps this bar a genuine prompt
          rather than permanent furniture nobody sees by the second visit. */}
      {timeLeft && (
        <div className="bg-gradient-to-r from-coral to-mango px-4 py-2.5 text-center text-sm font-semibold text-white">
          <i className="pi pi-clock mr-2 text-xs" aria-hidden />
          Ending soon · {timeLeft}
        </div>
      )}

      {/* The offer: the banner across the full width of the hero, the promise
          under it. The banner keeps its native 1200×630 — the ratio the portal
          previews and the ratio Facebook crops to — so what is posted to a feed
          and what is seen on arrival are the same picture, uncropped.

          Plain white, no wash. The banner, the coral badge and the gradient
          button are already the colour on this screen; corner glows behind them
          only muddied the edges of a page whose whole job is to look like a
          clean offer. Cream survives as the barely-there tint on alternate
          bands below. */}
      <section className="bg-white">

        {/* A wordmark, not a nav bar. Someone landing from a Facebook ad needs
            to know whose offer this is; they do not need a menu. It rides on the
            hero rather than in a bar of its own — the seam between the two was
            the first thing the eye landed on, ahead of the offer. */}
        <header className="relative border-b border-cream-dark/40">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4 sm:px-6 lg:max-w-6xl">
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

        {/* Picture left, pitch right — the arrangement every product page and
            every coupon site converges on, for the reason that matters here:
            run the banner edge to edge and a 1200×630 image is 600px of hero,
            so the first desktop screen is a photograph and nothing else. The
            name of the offer, its terms and its button all sat below the fold.
            Beside it they are all on the first screen, and the banner is still
            the largest thing on the page.

            Explicit row/column placement rather than nesting, so the source
            order — banner, pitch, review — is also the order a phone reads
            them. Nested columns would have put a stranger's review above the
            headline on mobile. */}
        {/* Less padding at the foot than the head: the band below opens with its
            own `py-10`, and two full paddings either side of one border is the
            widest empty gap on the page. */}
        <div className="relative mx-auto grid w-full max-w-2xl gap-6 px-4 pb-6 pt-8 sm:px-6 lg:max-w-6xl lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8 lg:pb-8 lg:pt-10">
          {/* The banner carries the rating rather than the page spending a
              section on it — the one number that does the most persuading, on
              the one element everyone looks at first. `ring-inset` rather than
              a border, so a pale banner still has a defined edge without the
              ring stealing a pixel of the picture. */}
          <div className="relative w-full overflow-hidden rounded-2xl bg-cream-light shadow-xl shadow-slate-900/10 ring-1 ring-inset ring-slate-900/10 lg:col-start-1 lg:row-start-1">
            <Image
              src={campaign.bannerImage}
              alt={campaign.name}
              // The banner sets its own height rather than being cut to fit a
              // 1200×630 frame. A promo banner is a designed thing — a phone
              // number along the bottom, a logo in a corner — and cropping it to
              // a shape it was not drawn for loses exactly the parts that were
              // put at the edges on purpose. Facebook still crops its own card
              // (that is what the portal's Link preview shows), but this page
              // does not have to, so it doesn't.
              //
              // `width`/`height` are the placeholder ratio held before the image
              // loads, not a claim about the file: `h-auto` hands the final
              // height to the picture's real proportions.
              width={1200}
              height={630}
              // The real measurements, not a round number: the container is
              // 72rem less its 3rem of padding on a wide screen and 40rem less
              // the same below that, so this stops asking for an image half as
              // wide again as anything that will ever be painted.
              sizes="(min-width: 1024px) 630px, (min-width: 640px) 592px, 100vw"
              // An expired promo should look expired before a word is read.
              className={`h-auto w-full ${campaign.hasEnded ? 'opacity-70 grayscale' : ''}`}
              priority
            />

            {/* Gives the rating something to sit on. Without it the card looks
                pasted onto whatever the photo happens to contain, and against a
                pale banner it loses its edge entirely. Confined to the bottom
                third, which is the strip the portal already tells editors to
                keep their copy out of. */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/70 to-transparent"
            />

            {/* Inside the frame rather than overhanging its corner: an overhang
                has to be paid for in clearance by whatever comes next, and this
                page has no space to spare. */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:bottom-4 sm:left-4">
              <i className="pi pi-star-fill text-mango" aria-hidden />
              <span className="leading-tight">
                <span className="block text-sm font-bold text-slate-900">4.9 / 5</span>
                <span className="block text-[11px] text-slate-500">500+ completed trips</span>
              </span>
            </div>
          </div>

          {/* Everything the visitor needs to decide, in one column: what it is,
              what it covers, when it dies, and the button. It spans every row
              on the left, and the pieces over there are chosen to come to about
              the same height — a banner alone against a full buy-box leaves a
              dead block under the picture. */}
          <div
            className={`min-w-0 lg:col-start-2 lg:row-start-1 ${
              // Spanning a row the left column never fills reserves a track and
              // its gap for nothing, and the pitch — being taller than the rows
              // that do exist — spills its overflow into that empty track as a
              // band of white under the whole hero. Span only what is there:
              // banner and steps, plus a third row when there is a review.
              review ? 'lg:row-span-3' : 'lg:row-span-2'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {campaign.hasEnded ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <i className="pi pi-clock text-[10px]" />
                  This offer has ended
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-2 rounded-full bg-coral px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-coral/25">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    Special offer
                  </span>

                  {endsOn && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-dark bg-cream-light px-3 py-1.5 text-xs font-medium text-slate-600">
                      <i className="pi pi-calendar text-[10px]" />
                      Ends {endsOn}
                      {timeLeft && <span className="font-bold text-coral">· {timeLeft}</span>}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* `break-words` is load-bearing: a campaign name is free text from
                the portal, and one long unbroken string would otherwise push the
                column past the edge of the page. */}
            <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-balance break-words text-slate-900 sm:text-4xl">
              {campaign.name}
            </h1>

            <p className="mt-3 leading-relaxed text-pretty break-words text-slate-600">
              {campaign.shortDescription}
            </p>

            {/* Dashed, like the tear-off edge of a voucher — the one place the
                page borrows the shorthand of a coupon, on the block that holds
                the terms and the button together. The form is a scroll away at
                every screen size, so this card owns the call to action and the
                form owns the fields. */}
            <aside className="mt-5 rounded-2xl border-2 border-dashed border-cream-dark bg-cream-light p-5">
              <dl className="divide-y divide-cream-dark/70">
                {glance.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-coral shadow-sm">
                      <i className={`pi ${item.icon} text-xs`} aria-hidden />
                    </span>
                    <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
                    <dd className="ml-auto text-right text-sm font-bold text-balance text-slate-900">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {!campaign.hasEnded && (
                <a
                  href="#claim"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral to-mango px-5 py-3.5 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:-translate-y-0.5 hover:from-coral-dark hover:to-mango-dark hover:shadow-xl"
                >
                  {campaign.ctaLabel}
                  <i className="pi pi-arrow-down text-xs" />
                </a>
              )}

              <a
                href="https://wa.me/639178046988"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-green-600 hover:text-green-700"
              >
                <i className="pi pi-whatsapp text-green-600" />
                Ask on WhatsApp
              </a>
            </aside>

          </div>

          {/* The three steps used to sit above the form. They earn more here:
              they fill the column beside the buy-box, and "what happens if I
              hand over my number" is a question being asked while the offer is
              read, not only once the first field is in view. */}
          {!campaign.hasEnded && (
            <ol className="lg:col-start-1 lg:row-start-2">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
                  {/* Threads the medallions into one sequence — three rows of
                      icon-and-text otherwise read as three unrelated notes.
                      Drawn from below one medallion to the top of the next, and
                      skipped on the last, which has nothing to point at.
                      `left-[17px] w-0.5` puts it dead centre under a 36px
                      medallion. The medallion is `relative` so it paints over
                      the line: both are positioned, and a positioned element
                      later in the source wins. A negative z-index would not
                      work here — it would drop the line behind the section's
                      own white background and out of sight entirely. */}
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-[17px] top-9 w-0.5 bg-cream-dark"
                    />
                  )}

                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-mango text-white shadow-md shadow-coral/20">
                    <i className={`pi ${step.icon} text-sm`} aria-hidden />
                  </span>

                  {/* Nudged down so the title sits against the medallion's
                      middle rather than its top edge. */}
                  <div className="min-w-0 pt-1">
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-snug text-slate-600">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {/* A real guest, not a curated one — the same loop the landing page
              closes, where a review approved in /admin/reviews becomes the proof
              shown to the next batch of leads. Last on the left, so its absence
              collapses a row rather than leaving a hole mid-column. Clamped: a
              guest who wrote six paragraphs must not stretch the fold. */}
          {review && (
            <figure className="rounded-2xl border border-cream-dark/70 bg-white p-5 shadow-sm lg:col-start-1 lg:row-start-3">
              <div
                className="flex items-center gap-0.5 text-mango"
                aria-label={`Rated ${review.rating} out of 5`}
              >
                {Array.from({ length: Math.max(1, Math.min(5, review.rating)) }).map((_, index) => (
                  <i key={index} className="pi pi-star-fill text-xs" aria-hidden />
                ))}
              </div>

              <blockquote className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-600">
                &ldquo;{review.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-3 flex items-center gap-2.5 border-t border-cream-dark/70 pt-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-mango text-xs font-bold text-white">
                  {review.name.charAt(0)}
                </span>
                <span className="truncate text-sm font-semibold text-slate-900">{review.name}</span>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* Narrower than the hero on purpose: prose and a form both read badly at
          six columns wide, and the step down signals "you have arrived at the
          part where you do something".

          The width lives on the inner div, never on the <section>. `globals.css`
          sets `main, section, .container { max-width: 100% }` outside any cascade
          layer, and unlayered CSS beats Tailwind's layered utilities whatever
          their specificity — so `max-w-*` on a <section> is silently ignored.
          Every landing component splits it the same way for the same reason. */}
      {bands.map((band, index) => (
        <section
          key={band.key}
          // Starts tinted, because the hero above it is white — the stripe is
          // anchored to what precedes it, not to the index alone.
          className={`border-t border-cream-dark/40 py-10 ${
            index % 2 === 0 ? 'bg-cream-light' : 'bg-white'
          }`}
        >
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:max-w-4xl">{band.content}</div>
        </section>
      ))}

      <Footer />
    </main>
  );
}
