const vehicles = [
  {
    type: 'Sedan',
    models: 'Vios / Mirage G4 (AT)',
    capacity: '5-seater',
    rate: 1500,
    features: ['Air Conditioned', 'Automatic Transmission', 'Fuel Efficient', 'City-friendly'],
    image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/vios.png',
    popular: false,
  },
  {
    type: 'SUV',
    models: 'Xpander / Avanza / Innova (AT)',
    capacity: '7-seater',
    rate: 2500,
    features: ['Air Conditioned', 'Automatic Transmission', 'Spacious Interior', 'Family-friendly'],
    image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/suv.png',
    popular: true,
  },
  {
    type: 'Van',
    models: 'NV350 / Hiace Commuter',
    capacity: '15-seater',
    rate: 3500,
    features: ['Air Conditioned', 'Group Travel', 'Luggage Space', 'Tour-ready'],
    image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/van.png',
    popular: false,
  },
];

export function FleetSection() {
  return (
    <section id="fleet" className="py-24 bg-white relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-papaya/20 text-terracotta px-4 py-2 rounded-full text-sm font-medium mb-4 border border-papaya/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4-10v2m0 12v2m-6-6H4m16 0h-2" />
            </svg>
            Our Fleet
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Well-Maintained Vehicles for <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-palm to-palm-dark bg-clip-text text-transparent">Every Need</span>
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
              className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                vehicle.popular ? 'ring-2 ring-coral shadow-lg shadow-coral/10' : 'border border-slate-100'
              }`}
            >
              {/* Popular Badge */}
              {vehicle.popular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-coral to-mango text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg animate-pulse">
                  POPULAR
                </div>
              )}

              {/* Vehicle Image */}
              <div className="h-48 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent z-10" />
                <img
                  src={vehicle.image}
                  alt={vehicle.type}
                  width={400}
                  height={200}
                  loading="eager"
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                />
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
                        className="w-4 h-4 text-palm"
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
                        ? 'bg-coral hover:bg-coral-dark text-white'
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
        <div className="mt-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-coral to-mango rounded-3xl" />
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
          <div className="relative p-8 sm:p-12 text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
                  clipRule="evenodd"
                />
              </svg>
              Special Offer
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
              Book for 3+ Days & Get Discounted Rates
            </h3>
            <p className="text-white/90 mb-8 max-w-xl mx-auto text-lg">
              Planning a longer trip? Contact us for special multi-day rental packages and save more on
              your Cebu adventure.
            </p>
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 bg-white text-coral hover:bg-white/95 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Inquire Now
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
      </div>
    </section>
  );
}
