/**
 * TrustBar Component
 *
 * Slim credibility strip placed directly under the hero. Funnel role:
 * reassure the visitor the moment after the hero's promise, before they
 * start evaluating services. Intentionally avoids duplicating the hero
 * stats — it surfaces *trust* signals (safety, pricing, support) instead.
 */

const trustItems = [
  {
    label: '4.9 / 5 guest rating',
    sub: '500+ completed trips',
    accent: 'text-mango bg-mango/10 border-mango/20',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    label: 'Licensed & insured',
    sub: 'Road-ready vehicles',
    accent: 'text-palm bg-palm/10 border-palm/20',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: 'Fixed honest rates',
    sub: 'No surprise charges',
    accent: 'text-coral bg-coral/10 border-coral/20',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Airport meet & greet',
    sub: 'Flight tracking included',
    accent: 'text-terracotta bg-terracotta/10 border-terracotta/20',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
      </svg>
    ),
  },
];

export function TrustBar() {
  return (
    <section className="relative z-10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-cream-dark/40 bg-cream-light p-3">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${item.accent}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold leading-tight text-slate-900">{item.label}</div>
                <div className="truncate text-xs leading-tight text-slate-600">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
