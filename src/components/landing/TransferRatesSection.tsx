const transferRates = [
  {
    passengers: '1-3',
    rate: 700,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    description: 'Solo travelers or small groups',
  },
  {
    passengers: '4-6',
    rate: 1000,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    description: 'Families or friend groups',
    popular: true,
  },
  {
    passengers: '7-14',
    rate: 1500,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    description: 'Large groups or teams',
  },
];

export function TransferRatesSection() {
  return (
    <section id="pricing" className="py-12 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-mango/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-coral/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-mango-dark px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-sm border border-mango/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3l14 9-14 9V3z"
              />
            </svg>
            Airport Transfers
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Airport <span className="text-mango">&harr;</span> Hotel Transfer Rates
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Smooth, comfortable transfers between Mactan-Cebu International Airport and hotels within
            Cebu City. Fixed rates, no hidden fees.
          </p>
        </div>

        {/* Rates Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {transferRates.map((transfer, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 ${transfer.popular
                  ? 'border-coral shadow-lg'
                  : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                }`}
            >
              {transfer.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-coral text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST BOOKED
                </div>
              )}

              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${transfer.popular ? 'bg-coral/10 text-coral' : 'bg-slate-100 text-slate-600'
                  }`}
              >
                {transfer.icon}
              </div>

              {/* Passengers */}
              <div className="mb-4">
                <div className="text-sm text-slate-500 mb-1">Passengers</div>
                <div className="text-3xl font-bold text-slate-900">{transfer.passengers} pax</div>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-sm mb-6">{transfer.description}</p>

              {/* Rate */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-end gap-1 mb-4">
                  <span
                    className={`text-3xl font-bold ${transfer.popular ? 'text-coral' : 'text-slate-900'}`}
                  >
                    ₱{transfer.rate.toLocaleString()}
                  </span>
                  <span className="text-slate-500 mb-1">/ way</span>
                </div>

                <a
                  href="#contact"
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${transfer.popular
                      ? 'bg-coral hover:bg-coral-dark text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                >
                  Book Transfer
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-papaya/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-terracotta" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Service Coverage</h4>
                <p className="text-slate-600 text-sm">
                  Rates shown are for transfers within Cebu City. For destinations outside the city
                  (e.g., Moalboal, Oslob, Bantayan Island), please contact us for a custom quote.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-palm-light/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-palm"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Flight Tracking</h4>
            <p className="text-sm text-slate-500">We monitor your flight for any delays</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-papaya/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-terracotta"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Fixed Rates</h4>
            <p className="text-sm text-slate-500">No surge pricing or hidden fees</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-mango/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-mango-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Meet & Greet</h4>
            <p className="text-sm text-slate-500">Driver waits at arrival with your name</p>
          </div>
        </div>
      </div>
    </section>
  );
}
