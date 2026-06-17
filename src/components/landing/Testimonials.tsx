/**
 * Testimonials Component
 *
 * Social-proof stage of the funnel. Placed right after WhyChooseUs and
 * immediately before the contact form, so the visitor reads real guest
 * voices at the exact moment of decision, then converts via the CTA.
 */

const testimonials = [
  {
    quote:
      'Booked an airport transfer and a 3-day rental. The driver was waiting with my name at arrivals and knew every shortcut. Easiest trip to Cebu I’ve had.',
    name: 'Marco Reyes',
    origin: 'Manila, Philippines',
    accent: 'from-coral to-mango',
  },
  {
    quote:
      'Fixed price, spotless van, and they replied on WhatsApp within minutes. Took our family of seven around Oslob and Moalboal without a single hiccup.',
    name: 'Hannah Lim',
    origin: 'Singapore',
    accent: 'from-palm to-palm-dark',
  },
  {
    quote:
      'Rented an SUV for a week with a driver. Honest rates, no surprise fees, and great local tips on where to eat. Already booked them again for next visit.',
    name: 'David Cooper',
    origin: 'Sydney, Australia',
    accent: 'from-mango to-coral',
  },
];

function Stars() {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-5 h-5 text-mango" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden scroll-mt-15 border-t border-cream-dark/50">
      {/* Decorative glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-mango/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-coral/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-mango-dark px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-sm border border-mango/20">
            <span className="w-1.5 h-1.5 bg-mango rounded-full animate-pulse" />
            Loved by Travelers
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            What Our <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">Guests Say</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Rated <span className="font-bold text-slate-900">4.9 / 5</span> across 500+ trips by visitors and locals exploring Cebu.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <Stars />
              <p className="text-slate-700 leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.accent} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 leading-tight">{t.name}</div>
                  <div className="text-sm text-slate-600 leading-tight">{t.origin}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Funnel CTA */}
        <div className="mt-14 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to be our next happy guest?</h3>
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl hover:-translate-y-0.5"
          >
            Book Your Ride Now
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
