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
    <section className="relative flex min-h-[60vh] items-end overflow-hidden pt-16 lg:min-h-[65vh] min-[1400px]:min-h-[75vh] min-[1600px]:min-h-[85vh]">
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://djuny0idasckxayv.public.blob.vercel-storage.com/cclex.webp"
          alt="Cebu skyline and bridge at sunset"
          className="h-full w-full object-cover saturate-[.85] brightness-90"
        />
        {/* Darkest behind the copy, clearing toward the right so the skyline shows. */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/30" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-end px-6 pb-10 pt-20 sm:px-4 lg:px-4 lg:pb-12 lg:pt-32">
        <div
          className="landing-hero-mobile-frame mx-auto min-w-0 max-w-[calc(100vw-1rem)] text-center sm:max-w-3xl lg:mx-0 lg:text-left animate-[slideIn_0.8s_ease-out_forwards]"
          style={{ width: 'min(100%, calc(100vw - 1rem))' }}
        >
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-mango/30 bg-mango/10 px-5 py-2.5 text-sm font-semibold text-mango-light shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md transition-all hover:bg-mango/20">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mango opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-mango"></span>
            </span>
            <span className="min-w-0 truncate sm:hidden">Cebu rides made simple</span>
            <span className="hidden sm:inline">Cebu car rental, airport transfers &amp; guided tours</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white drop-shadow-xl sm:text-5xl lg:text-6xl xl:text-7xl">
            Easy Cebu rides,
            <span className="mt-2 block bg-gradient-to-r from-mango via-papaya to-coral bg-clip-text text-transparent brightness-125 drop-shadow-lg">
              ready when you are.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg font-medium leading-relaxed text-white/90 drop-shadow-md sm:text-xl lg:mx-0">
            <span className="sm:hidden">Clean Cebu rentals, airport pickups, and guided tours with fast, fixed quotes.</span>
            <span className="hidden sm:inline">
              Book a clean, air-conditioned vehicle for airport pickup, city driving, or a full Cebu itinerary. Tell us your plan and get a clear quote fast.
            </span>
          </p>

            {/* <div className="grid gap-4 text-left sm:grid-cols-3">
            {confidenceItems.map((item) => (
              <div key={item} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/20">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-mango transition-transform group-hover:scale-110">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.704 5.292a1 1 0 010 1.416l-7.25 7.25a1 1 0 01-1.416 0l-3.25-3.25a1 1 0 111.416-1.416l2.542 2.543 6.542-6.543a1 1 0 011.416 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="leading-tight">{item}</span>
              </div>
            ))}
          </div> */}

          {/* The hero's only conversion path — everything points at #contact. */}
          <div className="mb-2 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
            <a
              href="#contact"
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coral to-mango px-8 py-4 text-lg font-bold text-white shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] ring-1 ring-white/20 transition-all hover:-translate-y-1 hover:from-coral-light hover:to-mango-light hover:shadow-[0_0_60px_-15px_rgba(220,38,38,0.7)] sm:w-auto"
            >
              <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></span>
              <span className="relative">Get a Free Quote</span>
              <svg
                className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#services"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/20 sm:w-auto"
            >
              View ride options
            </a>
          </div>

          {/* <p className="mb-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-medium text-white/80 lg:justify-start">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-mango" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No payment needed
            </span>
            <span aria-hidden className="hidden text-white/40 sm:inline">·</span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-mango" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Usually answered within the hour, 8AM–8PM
            </span>
          </p> */}


        </div>
      </div>
    </section>
  );
}
