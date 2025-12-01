'use client';

import { useState } from 'react';

type ServiceType = 'car-rental' | 'airport-transfer' | 'tour';
type VehicleType = 'sedan' | 'suv' | 'van';

export function HeroSection() {
  const [serviceType, setServiceType] = useState<ServiceType>('car-rental');
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [pickupDate, setPickupDate] = useState('');
  const [phone, setPhone] = useState('');
  const [addDriver, setAddDriver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          vehicleType: serviceType === 'car-rental' ? vehicleType : undefined,
          preferredDate: pickupDate,
          phone,
          addDriver,
          source: 'hero-quick-form',
        }),
      });

      if (response.ok) {
        alert('Thank you! We will contact you shortly.');
        setPickupDate('');
        setPhone('');
        setAddDriver(false);
      } else {
        alert('Something went wrong. Please try again or call us directly.');
      }
    } catch {
      alert('Something went wrong. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Gradient - Warm Tropical */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream-light to-papaya-light/30" />

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />

      {/* Decorative Elements - Tropical Warmth with animation */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-papaya/40 to-palm-light/30 rounded-full blur-3xl animate-pulse" style={{animationDuration: '4s'}} />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-gradient-to-tr from-mango/40 to-coral/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '5s'}} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-golden/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '6s'}} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-papaya-light/50 to-palm-light/30 text-palm-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              Cebu, Philippines
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Explore Cebu
              <span className="block bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">Your Way</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Premium car rentals, seamless airport transfers, and curated tour packages.
              Discover the Queen City of the South with comfort and flexibility.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm">
                <div className="w-10 h-10 bg-coral/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-coral" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-coral">500+</div>
                  <div className="text-xs text-slate-500">Happy Customers</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm">
                <div className="w-10 h-10 bg-palm-light/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-palm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4-10v2m0 12v2m-6-6H4m16 0h-2" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-palm">15+</div>
                  <div className="text-xs text-slate-500">Vehicles</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm">
                <div className="w-10 h-10 bg-mango/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-mango-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-mango-dark">5</div>
                  <div className="text-xs text-slate-500">Tour Packages</div>
                </div>
              </div>
            </div>

            {/* Secondary CTAs */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <a
                href="#tours"
                className="inline-flex items-center gap-2 bg-white border-2 border-coral text-coral hover:bg-coral/5 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                View Tour Packages
              </a>
              <a
                href="tel:+639123456789"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-coral px-6 py-3 font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Call Us Now
              </a>
            </div>
          </div>

          {/* Right: Booking Form */}
          <div className="relative">
            {/* Decorative elements behind form */}
            <div className="absolute -inset-4 bg-gradient-to-r from-coral/20 to-mango/20 rounded-3xl blur-2xl opacity-60" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-coral to-mango rounded-xl flex items-center justify-center shadow-lg shadow-coral/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Quick Booking</h2>
                  <p className="text-slate-500 text-sm">Get a quote in minutes</p>
                </div>
              </div>

              <form onSubmit={handleQuickBooking} className="space-y-4">
                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    What do you need?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'car-rental', label: 'Car Rental', icon: '🚗' },
                      { value: 'airport-transfer', label: 'Transfer', icon: '✈️' },
                      { value: 'tour', label: 'Tour', icon: '🗺️' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setServiceType(option.value as ServiceType)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          serviceType === option.value
                            ? 'border-coral bg-coral/5 text-coral'
                            : 'border-slate-200 hover:border-coral/50 text-slate-600'
                        }`}
                      >
                        <div className="text-xl mb-1">{option.icon}</div>
                        <div className="text-xs font-medium">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Type - Only for Car Rental */}
                {serviceType === 'car-rental' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-slate-700"
                    >
                      <option value="sedan">Sedan (5-seater) - ₱1,500/day</option>
                      <option value="suv">SUV (7-seater) - ₱2,500/day</option>
                      <option value="van">Van (15-seater) - ₱3,500/day</option>
                    </select>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {serviceType === 'tour' ? 'Tour Date' : 'Pick-up Date'}
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-slate-700"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-slate-700"
                    required
                  />
                </div>

                {/* Add Driver Option */}
                <div className="flex items-center gap-3 p-3 bg-mango/10 rounded-lg border border-mango/20">
                  <input
                    type="checkbox"
                    id="addDriverHero"
                    checked={addDriver}
                    onChange={(e) => setAddDriver(e.target.checked)}
                    className="w-5 h-5 text-mango bg-white border-slate-300 rounded focus:ring-mango focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="addDriverHero" className="flex-1 cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Add Driver</span>
                    <span className="block text-xs text-slate-500">+₱850/day for a professional driver</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark disabled:from-coral/70 disabled:to-mango/70 text-white py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-coral/25"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Get Quote
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Or Contact Directly */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-sm text-slate-500 text-center mb-4">Or contact us directly</p>
                <div className="flex gap-3">
                  <a
                    href="https://wa.me/639123456789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href="https://m.me/easyridescebu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
                    </svg>
                    Messenger
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <a href="#services" className="text-slate-400 hover:text-coral transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
