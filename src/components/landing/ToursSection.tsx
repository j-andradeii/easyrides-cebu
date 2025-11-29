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
    badge: 'bg-cyan-100 text-cyan-700',
    border: 'hover:border-cyan-200',
    button: 'bg-cyan-600 hover:bg-cyan-700',
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'hover:border-emerald-200',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  violet: {
    badge: 'bg-violet-100 text-violet-700',
    border: 'hover:border-violet-200',
    button: 'bg-violet-600 hover:bg-violet-700',
  },
  orange: {
    badge: 'bg-orange-100 text-orange-700',
    border: 'hover:border-orange-200',
    button: 'bg-orange-600 hover:bg-orange-700',
  },
  rose: {
    badge: 'bg-rose-100 text-rose-700',
    border: 'hover:border-rose-200',
    button: 'bg-rose-600 hover:bg-rose-700',
  },
};

export function ToursSection() {
  return (
    <section id="tours" className="py-20 bg-gradient-to-b from-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
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
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Discover the Best of Cebu
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
                className={`relative bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-all duration-300 ${colors.border} ${
                  tour.featured ? 'ring-2 ring-rose-400' : ''
                }`}
              >
                {tour.featured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
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
                      <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-violet-600"
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
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Want a Custom Itinerary?</h3>
            <p className="text-slate-600 mb-6">
              Design your own tour! Tell us your preferences, schedule, and budget — we&apos;ll
              create a personalized Cebu experience just for you.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
