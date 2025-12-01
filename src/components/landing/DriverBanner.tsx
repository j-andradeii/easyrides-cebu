export function DriverBanner() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div className="p-8 lg:p-12 relative z-10">
              <div className="inline-flex items-center gap-2 bg-mango/20 text-mango px-4 py-2 rounded-full text-sm font-medium mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Add-On Service
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prefer a Hassle-Free Ride?
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                Hire one of our professional, experienced drivers and enjoy your trip without worrying
                about navigation or parking.
              </p>

              {/* Pricing */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-mango text-sm font-medium mb-1">Driver Fee</div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-white">₱850</span>
                    <span className="text-slate-400 mb-1">/ 8 hours</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-mango text-sm font-medium mb-1">Overtime Rate</div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-white">₱250</span>
                    <span className="text-slate-400 mb-1">/ hour</span>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="bg-white/5 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-papaya mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-slate-300">
                    <span className="text-white font-medium">Note:</span> For out-of-town trips, the
                    renter covers fuel, driver&apos;s meals, and accommodation.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-mango to-golden hover:from-mango-dark hover:to-mango text-slate-900 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Add Driver to Booking
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

            {/* Visual */}
            <div className="hidden lg:flex items-center justify-center p-8">
              <div className="relative">
                {/* Driver Icon/Illustration Placeholder */}
                <div className="w-64 h-64 bg-gradient-to-br from-papaya/20 to-mango/20 rounded-full flex items-center justify-center">
                  <div className="w-48 h-48 bg-gradient-to-br from-papaya/30 to-mango/30 rounded-full flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-white/80"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-palm-light/30 rounded-full flex items-center justify-center">
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
                    </div>
                    <span className="text-sm font-medium text-slate-700">Licensed</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-papaya/30 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-terracotta"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-700">Experienced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
