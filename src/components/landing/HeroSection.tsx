/**
 * Hero — the top of the funnel.
 *
 * The quick-quote form (and the CTA card that briefly replaced it) are gone:
 * the hero's only job now is to land the promise and push people to the one
 * capture form on the page, in ContactSection (#contact). That form also asks
 * for a name and email, so a lead can be followed up by more than a phone call.
 *
 * No state, no effects — this renders on the server, so the hero ships no JS.
 */

const confidenceItems = [
  'Fixed, honest rates',
  'Clean air-conditioned vehicles',
  'Fast Replies',
];

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden pt-16">
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://djuny0idasckxayv.public.blob.vercel-storage.com/easyrides-hero.webp"
          alt="Cebu skyline and bridge at sunset"
          className="h-full w-full object-cover saturate-[.72]"
        />
        {/* Darkest behind the copy, clearing toward the right so the skyline shows. */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/70 to-slate-950/40" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div
          className="landing-hero-mobile-frame mx-auto min-w-0 max-w-[calc(100vw-2rem)] text-center sm:max-w-3xl lg:mx-0 lg:text-left"
          style={{ width: 'min(100%, calc(100vw - 2rem))' }}
        >
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-mango" />
            <span className="min-w-0 truncate sm:hidden">Cebu rides made simple</span>
            <span className="hidden sm:inline">Cebu car rental, airport transfers &amp; guided tours</span>
          </div>

          <h1 className="mb-6 text-3xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
            Easy Cebu rides,
            <span className="block bg-gradient-to-r from-mango to-coral bg-clip-text text-transparent brightness-110">
              ready when you are.
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base font-medium leading-relaxed text-white drop-shadow-md sm:text-xl lg:mx-0">
            <span className="sm:hidden">Clean Cebu rentals, airport pickups, and guided tours with fast, fixed quotes.</span>
            <span className="hidden sm:inline">
              Book a clean, air-conditioned vehicle for airport pickup, city driving, or a full Cebu itinerary. Tell us your plan and get a clear quote fast.
            </span>
          </p>

          {/* The hero's only conversion path — everything points at #contact. */}
          <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#contact"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral to-mango px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-coral/30 transition-all hover:-translate-y-0.5 hover:from-coral-dark hover:to-mango-dark hover:shadow-2xl hover:shadow-coral/40 sm:w-auto"
            >
              Get a Free Quote
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#services"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:w-auto"
            >
              View ride options
            </a>
          </div>

          <p className="mb-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-white/80 lg:justify-start">
            <svg className="h-4 w-4 flex-shrink-0 text-mango" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No payment needed</span>
            <span aria-hidden className="text-white/40">·</span>
            <span>Usually answered within the hour, 8AM–8PM</span>
          </p>

          <div className="grid gap-3 text-left sm:grid-cols-3">
            {confidenceItems.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur-md">
                <svg className="h-4 w-4 flex-shrink-0 text-mango" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 5.292a1 1 0 010 1.416l-7.25 7.25a1 1 0 01-1.416 0l-3.25-3.25a1 1 0 111.416-1.416l2.542 2.543 6.542-6.543a1 1 0 011.416 0z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
