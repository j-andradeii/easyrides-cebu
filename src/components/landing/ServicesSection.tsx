'use client';

import Link from 'next/link';
import { useState } from 'react';

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
    shortTitle: 'Car Rentals',
    description:
      'Experience the freedom of the road. From the majestic CCLEX to the scenic mountain views of Tops, our fleet is ready for your adventure.',
    image: 'https://www.mitsubishi-motors.com.ph/content/dam/mitsubishi-motors-ph/images/site-images/articles/2020/xpander-cross/Xpander-Cross-03.jpg',
    features: ['Unlimited mileage option', 'Comprehensive Insurance', '24/7 Roadside support'],
    color: 'orange',
    link: '/#fleet',
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
    shortTitle: 'Transfers',
    description:
      'Start your trip stress-free with our premium airport transfer service. We monitor your flight and ensure a smooth pickup.',
    image: 'https://s28477.pcdn.co/wp-content/uploads/2018/05/CEB_2A-984x554.jpg',
    features: ['Flight tracking', 'Meet & greet service', 'Fixed competitive rates'],
    color: 'cyan',
    link: '/#contact',
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
    shortTitle: 'Tours',
    description:
      "From waterfalls to heritage sites, discover the best of Cebu with our curated tour packages designed for every type of traveler.",
    image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/tours/oslob.avif',
    features: ['1D to 5D4N packages', 'Expert local guides', 'All-inclusive options'],
    color: 'emerald',
    link: '/tours',
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
    title: 'Custom Itinerary',
    shortTitle: 'Custom',
    description:
      'Your trip, your way. Our travel experts help you design a personalized itinerary that fits your specific preferences and budget.',
    image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/tours/city_tour.png',
    features: ['Flexible scheduling', 'Personalized routes', 'Budget-friendly planning'],
    color: 'violet',
    link: '/#contact',
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
    title: 'City Transport',
    shortTitle: 'Transport',
    description:
      'Safe, reliable, and convenient transport for business meetings, events, or simply getting around Cebu City and Mandaue.',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80',
    features: ['Business class vehicles', 'Professional chauffeurs', 'Hourly bookings'],
    color: 'rose',
    link: '/#contact',
  },
];

const colorClasses = {
  orange: { badge: 'bg-mango text-white', btn: 'bg-mango hover:bg-mango-dark' },
  cyan: { badge: 'bg-terracotta text-white', btn: 'bg-terracotta hover:bg-terracotta/90' },
  emerald: { badge: 'bg-palm text-white', btn: 'bg-palm hover:bg-palm/90' },
  violet: { badge: 'bg-coral text-white', btn: 'bg-coral hover:bg-coral/90' },
  rose: { badge: 'bg-hibiscus text-white', btn: 'bg-hibiscus hover:bg-hibiscus-dark' },
};

export function ServicesSection() {
  const [activeId, setActiveId] = useState(0);

  return (
    <section id="services" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-papaya/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-palm-light/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-slate-200 shadow-sm">
            <span className="w-1.5 h-1.5 bg-terracotta rounded-full animate-pulse" />
            Select a service to explore
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Tailored for Your <br className="hidden sm:block" />
            <span className="text-terracotta">Cebu Experience</span>
          </h2>
        </div>

        {/* Accordion Container */}
        <div className="flex flex-col lg:flex-row gap-4 h-[920px] lg:h-[600px] w-full">
          {services.map((service, index) => {
            const isActive = activeId === index;
            const colors = colorClasses[service.color as keyof typeof colorClasses];

            return (
              <div
                key={index}
                onClick={() => setActiveId(index)}
                className={`
                  relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out
                  ${isActive ? 'flex-[10] lg:flex-[3]' : 'flex-[2] lg:flex-[0.5] hover:lg:flex-[0.75]'}
                  group
                `}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url(${service.image})` }}
                />

                {/* Overlay - Darker when active to read text, Lighter when inactive to show image hint */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500
                    ${isActive ? 'bg-slate-900/40 lg:bg-gradient-to-r lg:from-slate-900/50 lg:via-slate-900/50 lg:to-transparent' : 'bg-slate-900/50 group-hover:bg-slate-900/40'}
                  `}
                />

                {/* Active Content */}
                <div className={`
                  absolute inset-0 p-8 lg:p-12 flex flex-col justify-end lg:justify-center transition-all duration-500
                  ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none hidden lg:flex'}
                `}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit mb-4 ${colors.badge}`}>
                    {service.shortTitle}
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight max-w-lg">
                    {service.title}
                  </h3>
                  <p className="text-slate-200 text-base lg:text-lg mb-8 max-w-md leading-relaxed font-semibold">
                    {service.description}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-white/90 font-semibold" >
                        <svg className="w-5 h-5 text-mango flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href={service.link} className={`
                    w-fit px-8 py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2
                    ${colors.btn}
                  `}>
                    Explore {service.shortTitle}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>

                {/* Inactive Content - Vertical Text */}
                <div className={`
                  absolute inset-0 flex flex-col items-center justify-center transition-all duration-500
                  ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                `}>
                  <div className="flex items-center gap-4 lg:gap-8 whitespace-nowrap lg:-rotate-90">
                    {/* <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white backdrop-blur-sm shadow-lg lg:rotate-90">
                      <div style={{ width: '24px', height: '24px' }}>
                        {service.icon}
                      </div>
                    </div> */}
                    <span className="text-2xl font-bold text-white tracking-[0.2em] uppercase drop-shadow-md">
                      {service.shortTitle}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
