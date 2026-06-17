/**
 * HowItWorks Component
 *
 * Funnel friction-reducer placed right after Services. It answers the
 * silent objection "is booking complicated?" with a simple 3-step path,
 * then funnels the now-reassured visitor straight to the contact form.
 */

const steps = [
  {
    title: 'Tell Us Your Plan',
    description:
      'Pick a service and date, then drop your phone or WhatsApp number. Takes less than a minute — no account, no card needed.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Get a Fast Quote',
    description:
      'We confirm availability and send a clear, fixed-price quote straight to your chat — usually within minutes, including driver options.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Sit Back & Ride',
    description:
      'Your clean, air-conditioned vehicle (and pro driver, if you like) arrives on time. Just enjoy the Queen City of the South.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 5h8m-4-10v2m0 12v2m-6-6H4m16 0h-2M6.343 6.343l1.414 1.414m8.486 8.486l1.414 1.414M6.343 17.657l1.414-1.414m8.486-8.486l1.414-1.414" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden scroll-mt-15 border-t border-cream-dark/50">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-coral/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-mango/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-coral px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-sm border border-coral/20">
            <span className="w-1.5 h-1.5 bg-coral rounded-full animate-pulse" />
            Simple & Stress-Free
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Booking Your Ride in{' '}
            <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">3 Easy Steps</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            No long forms or back-and-forth. Tell us what you need and we&apos;ll handle the rest.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-coral/30 via-mango/30 to-coral/30" />

          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              {/* Icon tile with step-number badge */}
              <div className="relative inline-flex mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-coral/10 to-mango/10 rounded-2xl flex items-center justify-center text-coral group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-coral to-mango text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-coral/25">
                  {index + 1}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-coral transition-colors">
                {step.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Funnel CTA */}
        <div className="mt-14 text-center">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl hover:-translate-y-0.5"
          >
            Get My Free Quote
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <p className="text-sm text-slate-500 mt-3">No payment required to get a quote.</p>
        </div>
      </div>
    </section>
  );
}
