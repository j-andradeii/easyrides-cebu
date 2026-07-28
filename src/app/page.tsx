import {
  Navigation,
  HeroSection,
  TrustBar,
  ServicesSection,
  HowItWorks,
  FleetSection,
  ToursSection,
  TransferRatesSection,
  DriverBanner,
  WhyChooseUs,
  Testimonials,
  ContactSection,
  Footer,
} from '@/components/landing';
import { getPublishedTestimonials } from '@/lib/crm/testimonials';

/**
 * Landing page — built as a single conversion funnel.
 *
 * The section order deliberately walks the visitor down the funnel
 * (Attention -> Interest -> Desire -> Trust -> Action), with a primary CTA
 * pointing at #contact repeated at each "ready to act" moment.
 */
/**
 * Rebuilt hourly so reviews approved in /admin/reviews reach the landing page
 * without a redeploy, while the page stays static for visitors.
 */
export const revalidate = 3600;

export default async function Home() {
  // Reviews approved in /admin/reviews replace the curated quotes (plan §7A.2).
  const publishedReviews = await getPublishedTestimonials();

  return (
    <>
      {/* A11y: let keyboard / screen-reader users jump straight past the nav */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-coral focus:px-4 focus:py-2 focus:font-semibold focus:text-white focus:shadow-lg focus:shadow-coral/30"
      >
        Skip to main content
      </a>

      <Navigation />

      <main id="main-content" className="min-h-screen overflow-x-hidden">
        {/* 1. ATTENTION - hero promise + immediate quick-booking capture */}
        <HeroSection />

        {/* 2. CREDIBILITY - reassure right after the promise */}
        <TrustBar />

        {/* 3. INTEREST - what we offer */}
        <ServicesSection />

        {/* 4. FRICTION REDUCER - show how easy booking is */}
        <HowItWorks />

        {/* 5. DESIRE - core products and pricing */}
        <FleetSection />
        <ToursSection />
        <TransferRatesSection />

        {/* 6. UPSELL - professional driver add-on; its CTA pre-fills + scrolls to #contact */}
        <DriverBanner />

        {/* 7. OBJECTION HANDLING - why us */}
        <WhyChooseUs />

        {/* 8. SOCIAL PROOF - guest voices right before the ask */}
        <Testimonials reviews={publishedReviews} />

        {/* 9. ACTION - final conversion form */}
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}
