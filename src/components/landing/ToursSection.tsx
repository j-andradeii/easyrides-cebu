const tourPackages = [
  {
    duration: '1 Day',
    shortName: '1D',
    title: 'Day Trip',
    description: 'Perfect for quick visits. Explore top Cebu attractions in a single day.',
    highlights: ['City Tour', 'Beach Visit', 'Local Food'],
    color: 'cyan',
  },
  {
    duration: '2 Days / 1 Night',
    shortName: '2D1N',
    title: 'Weekend Escape',
    description: 'A short getaway to experience the best of Cebu with an overnight stay.',
    highlights: ['Island Hopping', 'Snorkeling', 'Sunset View'],
    color: 'emerald',
  },
  {
    duration: '3 Days / 2 Nights',
    shortName: '3D2N',
    title: 'Explorer Package',
    description: 'The ideal duration to cover major attractions and hidden gems.',
    highlights: ['Kawasan Falls', 'Whale Sharks', 'Heritage Sites'],
    color: 'violet',
  },
  {
    duration: '4 Days / 3 Nights',
    shortName: '4D3N',
    title: 'Adventure Tour',
    description: 'Extended exploration with time for adventure activities and relaxation.',
    highlights: ['Canyoneering', 'Diving', 'Mountain Trails'],
    color: 'orange',
  },
  {
    duration: '5 Days / 4 Nights',
    shortName: '5D4N',
    title: 'Complete Cebu',
    description: 'The ultimate Cebu experience. Cover everything the island has to offer.',
    highlights: ['All Attractions', 'Premium Stay', 'Full Experience'],
    color: 'rose',
    featured: true,
  },
];

const colorClasses = {
  cyan: {
    badge: 'bg-papaya/30 text-terracotta',
    border: 'hover:border-papaya',
    button: 'bg-terracotta hover:bg-terracotta-dark',
  },
  emerald: {
    badge: 'bg-palm-light/30 text-palm-dark',
    border: 'hover:border-palm-light',
    button: 'bg-palm hover:bg-palm-dark',
  },
  violet: {
    badge: 'bg-coral/10 text-coral',
    border: 'hover:border-coral/50',
    button: 'bg-coral hover:bg-coral-dark',
  },
  orange: {
    badge: 'bg-mango/30 text-mango-dark',
    border: 'hover:border-mango',
    button: 'bg-mango hover:bg-mango-dark text-slate-900',
  },
  rose: {
    badge: 'bg-hibiscus/20 text-hibiscus-dark',
    border: 'hover:border-hibiscus',
    button: 'bg-hibiscus hover:bg-hibiscus-dark',
  },
};

export function ToursSection() {
  return (
    <section id="tours" className="py-24 bg-gradient-to-b from-slate-50 via-cream-light/20 to-white relative overflow-hidden">
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
            Discover the <span className="bg-gradient-to-r from-mango to-coral bg-clip-text text-transparent">Best of Cebu</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From quick day trips to comprehensive island adventures. Each package showcases
            Cebu&apos;s top attractions — historical landmarks to breathtaking natural spots.
          </p>
        </div>

        {/* Tour Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {tourPackages.map((tour, index) => {
            const colors = colorClasses[tour.color as keyof typeof colorClasses];
            return (
              <div
                key={index}
                className={`group relative bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${colors.border} ${
                  tour.featured ? 'ring-2 ring-coral shadow-lg shadow-coral/10' : ''
                }`}
              >
                {tour.featured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-coral to-mango text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    BEST VALUE
                  </div>
                )}

                {/* Duration Badge */}
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mb-4 ${colors.badge}`}
                >
                  {tour.shortName}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{tour.title}</h3>
                <p className="text-sm text-slate-500 mb-1">{tour.duration}</p>
                <p className="text-slate-600 text-sm mb-4">{tour.description}</p>

                {/* Highlights */}
                <ul className="space-y-2 mb-6">
                  {tour.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-500">
                      <svg className="w-4 h-4 text-palm" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {highlight}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="#contact"
                  className={`block w-full text-center py-3 rounded-lg font-semibold text-white transition-colors ${colors.button}`}
                >
                  Inquire
                </a>
              </div>
            );
          })}
        </div>

        {/* Custom Tour CTA */}
        <div className="mt-16 text-center">
          <div className="relative bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 max-w-2xl mx-auto overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-mango/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-coral/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-mango/30 to-coral/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-8 h-8 text-mango-dark"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Want a Custom Itinerary?</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Design your own tour! Tell us your preferences, schedule, and budget — we&apos;ll
                create a personalized Cebu experience just for you.
              </p>
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Let&apos;s Plan Together
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
