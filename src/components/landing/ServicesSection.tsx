const services = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7h8m-8 5h8m-4-10v2m0 12v2m-6-6H4m16 0h-2M6.343 6.343l1.414 1.414m8.486 8.486l1.414 1.414M6.343 17.657l1.414-1.414m8.486-8.486l1.414-1.414"
        />
      </svg>
    ),
    title: 'Car Rentals',
    description:
      'Self-drive or with professional driver. Well-maintained sedans, SUVs, and vans for any occasion.',
    features: ['Self-drive option', 'Professional drivers', 'Daily/weekly rates'],
    color: 'cyan',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 3l14 9-14 9V3z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 12H5m7-7v14"
        />
      </svg>
    ),
    title: 'Airport Transfers',
    description:
      'Smooth pickups and drop-offs to/from Mactan-Cebu International Airport. Start or end your trip stress-free.',
    features: ['Meet & greet', 'Flight tracking', 'Fixed rates'],
    color: 'orange',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
    title: 'Tour Packages',
    description:
      "Exclusive Cebu tours from 1-day trips to 5D4N adventures. Discover the island's best attractions.",
    features: ['1D to 5D4N packages', 'Top attractions', 'All-inclusive options'],
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
    title: 'Custom Tours',
    description:
      'Design your own itinerary. We help create personalized experiences that fit your preferences and budget.',
    features: ['Flexible scheduling', 'Personalized routes', 'Budget-friendly'],
    color: 'violet',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    title: 'Cebu Transport',
    description:
      'Safe and convenient transport anywhere in Cebu. Perfect for personal trips, business, or group outings.',
    features: ['City & provincial', 'Business travel', 'Group transport'],
    color: 'rose',
  },
];

const colorClasses = {
  cyan: {
    bg: 'bg-papaya/20',
    icon: 'text-terracotta',
    border: 'group-hover:border-papaya',
  },
  orange: {
    bg: 'bg-mango/20',
    icon: 'text-mango-dark',
    border: 'group-hover:border-mango',
  },
  emerald: {
    bg: 'bg-palm-light/20',
    icon: 'text-palm',
    border: 'group-hover:border-palm-light',
  },
  violet: {
    bg: 'bg-coral/10',
    icon: 'text-coral',
    border: 'group-hover:border-coral/50',
  },
  rose: {
    bg: 'bg-hibiscus/20',
    icon: 'text-hibiscus-dark',
    border: 'group-hover:border-hibiscus',
  },
};

export function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-papaya/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-palm-light/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-terracotta px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-sm">
            <span className="w-2 h-2 bg-coral rounded-full animate-pulse" />
            Our Services
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Everything You Need for Your <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">Cebu Adventure</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From airport pickups to island tours, we&apos;ve got you covered with reliable
            transportation services tailored to your needs.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const colors = colorClasses[service.color as keyof typeof colorClasses];
            return (
              <div
                key={index}
                className={`group bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${colors.border}`}
              >
                {/* Icon */}
                <div
                  className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4 ${colors.icon} group-hover:scale-110 transition-transform duration-300`}
                >
                  {service.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-coral transition-colors">{service.title}</h3>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">{service.description}</p>

                {/* Features */}
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-500">
                      <svg
                        className={`w-4 h-4 ${colors.icon} flex-shrink-0`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:-translate-y-0.5"
          >
            Get Started Today
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
