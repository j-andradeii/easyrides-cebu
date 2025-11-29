const vehicles = [
  {
    type: 'Sedan',
    models: 'Vios / Mirage G4 (AT)',
    capacity: '5-seater',
    rate: 1500,
    features: ['Air Conditioned', 'Automatic Transmission', 'Fuel Efficient', 'City-friendly'],
    image: '/images/sedan-placeholder.jpg',
    popular: false,
  },
  {
    type: 'SUV',
    models: 'Xpander / Avanza / Innova (AT)',
    capacity: '7-seater',
    rate: 2500,
    features: ['Air Conditioned', 'Automatic Transmission', 'Spacious Interior', 'Family-friendly'],
    image: '/images/suv-placeholder.jpg',
    popular: true,
  },
  {
    type: 'Van',
    models: 'NV350 / Hiace Commuter',
    capacity: '15-seater',
    rate: 3500,
    features: ['Air Conditioned', 'Group Travel', 'Luggage Space', 'Tour-ready'],
    image: '/images/van-placeholder.jpg',
    popular: false,
  },
];

export function FleetSection() {
  return (
    <section id="fleet" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Our Fleet
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Well-Maintained Vehicles for Every Need
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose from our selection of reliable, fully air-conditioned vehicles. All rates are for
            self-drive rentals.
          </p>
        </div>

        {/* Vehicle Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {vehicles.map((vehicle, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
                vehicle.popular ? 'ring-2 ring-cyan-500' : ''
              }`}
            >
              {/* Popular Badge */}
              {vehicle.popular && (
                <div className="absolute top-4 right-4 bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                  POPULAR
                </div>
              )}

              {/* Vehicle Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-20 h-20 text-slate-300 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 7h8m-8 5h8m-4-10v2m0 12v2m-6-6H4m16 0h-2M6.343 6.343l1.414 1.414m8.486 8.486l1.414 1.414M6.343 17.657l1.414-1.414m8.486-8.486l1.414-1.414"
                    />
                  </svg>
                  <span className="text-sm text-slate-400">{vehicle.type} Image</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Type & Models */}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-slate-900">{vehicle.type}</h3>
                  <p className="text-slate-500 text-sm">{vehicle.models}</p>
                </div>

                {/* Capacity Badge */}
                <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {vehicle.capacity}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {vehicle.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg
                        className="w-4 h-4 text-cyan-500"
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

                {/* Price */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-3xl font-bold text-slate-900">
                      ₱{vehicle.rate.toLocaleString()}
                    </span>
                    <span className="text-slate-500 mb-1">/day</span>
                  </div>

                  <a
                    href="#contact"
                    className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                      vehicle.popular
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Book This Vehicle
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Discount Note */}
        <div className="mt-12 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-8 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
                clipRule="evenodd"
              />
            </svg>
            Special Offer
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">
            Book for 3+ Days & Get Discounted Rates
          </h3>
          <p className="text-cyan-100 mb-6 max-w-xl mx-auto">
            Planning a longer trip? Contact us for special multi-day rental packages and save more on
            your Cebu adventure.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 bg-white text-cyan-600 hover:bg-cyan-50 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Inquire Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
