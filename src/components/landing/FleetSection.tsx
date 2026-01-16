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
    <section id="fleet" className="py-2 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-palm-light/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-mango/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white text-terracotta px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-sm border border-slate-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta"></span>
            </span>
            Our Fleet
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Premium Vehicles for <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-palm to-palm-dark bg-clip-text text-transparent">Every Journey</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose from our meticulously maintained fleet. Whether you need a compact city car
            or a spacious van for the whole family, we've got the perfect ride for you.
          </p>
        </div>

        {/* Vehicle Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {vehicles.map((vehicle, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-3xl overflow-hidden transition-all duration-300 ${vehicle.popular
                ? 'ring-1 ring-coral/20 shadow-xl shadow-coral/5 hover:shadow-2xl hover:shadow-coral/10 hover:-translate-y-1'
                : 'border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1'
                }`}
            >
              {/* Popular Badge */}
              {vehicle.popular && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-gradient-to-r from-coral to-mango text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-coral/20">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Image Container */}
              <div className="relative h-56 bg-gradient-to-br from-slate-50 to-white overflow-hidden p-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/50 via-transparent to-transparent" />
                <img
                  src={vehicle.image}
                  alt={vehicle.type}
                  className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500 will-change-transform"
                />
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">{vehicle.type}</h3>
                    <p className="text-slate-500 text-sm font-medium">{vehicle.models}</p>
                  </div>
                  <div className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-slate-100">
                    {vehicle.capacity}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {vehicle.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-600">
                      <div className={`p-1 rounded-full ${vehicle.popular ? 'bg-coral/10 text-coral' : 'bg-palm-light/10 text-palm'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Price & Action */}
                <div className="pt-6 border-t border-slate-50">
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-3xl font-bold text-slate-900">₱{vehicle.rate.toLocaleString()}</span>
                    <span className="text-slate-400 font-medium mb-1.5 line-through decoration-slate-300 decoration-2 opacity-50 text-sm ml-2">₱{(vehicle.rate * 1.2).toLocaleString()}</span>
                    <span className="text-slate-500 mb-1.5 text-sm ml-auto">/ 24 hours</span>
                  </div>

                  <a
                    href="#contact"
                    className={`block w-full py-4 rounded-xl font-bold text-center transition-all duration-300 ${vehicle.popular
                      ? 'bg-gradient-to-r from-coral to-mango text-white shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:-translate-y-0.5'
                      : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                  >
                    Book Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Discount Note */}
        <div className="mt-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-coral to-mango rounded-3xl" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
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
