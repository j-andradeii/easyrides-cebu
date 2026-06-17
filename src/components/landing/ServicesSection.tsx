'use client';

import Link from 'next/link';

import { servicesData } from '@/data/services';

const serviceIcons = {
  'car-rentals': (
    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 17h8m-10 0h.01M18 17h.01M5 13l1.2-4.2A3 3 0 019.08 6h5.84a3 3 0 012.88 2.8L19 13m-14 0h14v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5z"
      />
    </svg>
  ),
  'airport-transfers': (
    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5 12h14M12 5l7 7-7 7M6 5l5 7-5 7"
      />
    </svg>
  ),
  'tour-packages': (
    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zm0 0V3m6 18V6"
      />
    </svg>
  ),
  'custom-itinerary': (
    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  ),
  'city-transport': (
    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
};

const services = servicesData.map((service) => ({
  ...service,
  icon: serviceIcons[service.id as keyof typeof serviceIcons],
}));

const primaryServices = services.slice(0, 3);
const supportingServices = services.slice(3);

const colorClasses = {
  orange: {
    accent: 'text-mango bg-mango/10',
    badge: 'text-mango-dark bg-mango/10 border-mango/20',
    button: 'from-coral to-mango hover:from-coral-dark hover:to-mango-dark',
  },
  cyan: {
    accent: 'text-terracotta bg-terracotta/10',
    badge: 'text-terracotta bg-terracotta/10 border-terracotta/20',
    button: 'from-terracotta to-coral hover:from-terracotta-dark hover:to-coral-dark',
  },
  emerald: {
    accent: 'text-palm bg-palm/10',
    badge: 'text-palm bg-palm/10 border-palm/20',
    button: 'from-palm to-palm-dark hover:from-palm-light hover:to-palm',
  },
  violet: {
    accent: 'text-coral bg-coral/10',
    badge: 'text-coral bg-coral/10 border-coral/20',
    button: 'from-coral to-mango hover:from-coral-dark hover:to-mango-dark',
  },
  rose: {
    accent: 'text-hibiscus bg-hibiscus/10',
    badge: 'text-hibiscus bg-hibiscus/10 border-hibiscus/20',
    button: 'from-hibiscus to-terracotta hover:from-hibiscus-dark hover:to-terracotta-dark',
  },
};

function getCtaLabel(link: string) {
  if (link === '/#fleet') return 'View fleet';
  if (link === '/tours') return 'Browse tours';
  return 'Get a quote';
}

export function ServicesSection() {
  return (
    <section id="services" className="relative overflow-hidden bg-cream py-14 sm:py-20 scroll-mt-15 border-t border-cream-dark/50">
      <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 rounded-full bg-papaya/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 rounded-full bg-palm-light/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 sm:mb-14 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-coral/20 bg-white px-4 py-2 text-sm font-medium text-coral shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            Ride Options
          </div>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            Choose the easiest way to{' '}
            <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">
              move around Cebu
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Start with the service that matches your trip. Every option leads to a clear quote, flexible schedule, and local support.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {primaryServices.map((service) => {
            const colors = colorClasses[service.color];

            return (
              <article
                key={service.id}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
                  <div className={`absolute left-4 top-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${colors.badge}`}>
                    {service.shortTitle}
                  </div>
                </div>

                <div className="p-6">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${colors.accent}`}>
                    {service.icon}
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-900">{service.title}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-slate-600">{service.description}</p>

                  <div className="mb-6 space-y-2">
                    {service.features.slice(0, 2).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <svg className="h-4 w-4 flex-shrink-0 text-palm" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 5.292a1 1 0 010 1.416l-7.25 7.25a1 1 0 01-1.416 0l-3.25-3.25a1 1 0 111.416-1.416l2.542 2.543 6.542-6.543a1 1 0 011.416 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={service.link}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-lg shadow-coral/15 transition-all hover:-translate-y-0.5 hover:shadow-xl ${colors.button}`}
                  >
                    {getCtaLabel(service.link)}
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {supportingServices.map((service) => {
            const colors = colorClasses[service.color];

            return (
              <Link
                key={service.id}
                href={service.link}
                className="group flex items-center gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${colors.accent}`}>
                  {service.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 transition-colors group-hover:text-coral">{service.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                </div>
                <svg className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
