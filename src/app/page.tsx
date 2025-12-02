import {
  Navigation,
  HeroSection,
  ServicesSection,
  FleetSection,
  DriverBanner,
  // ToursSection,
  TransferRatesSection,
  WhyChooseUs,
  ContactSection,
  Footer,
} from '@/components/landing';
import FacebookMessenger from '@/components/FacebookMessenger';

export default function Home() {
  return (
    <main className="min-h-screen scroll-smooth">
      <Navigation />
      <HeroSection />

      {/* Divider wave */}
      <div className="relative h-16 -mt-1 bg-white overflow-hidden">
        <svg className="absolute bottom-0 w-full h-16 text-slate-50" preserveAspectRatio="none" viewBox="0 0 1440 54">
          <path fill="currentColor" d="M0 22L60 16.7C120 11 240 1.00001 360 0.700012C480 1.00001 600 11 720 16.7C840 22 960 24 1080 24.7C1200 26 1320 26 1380 26.3L1440 27V54H1380C1320 54 1200 54 1080 54C960 54 840 54 720 54C600 54 480 54 360 54C240 54 120 54 60 54H0V22Z"/>
        </svg>
      </div>

      <ServicesSection />
      <FleetSection />
      <DriverBanner />
      {/* <ToursSection /> */}
      <TransferRatesSection />
      <WhyChooseUs />
      <ContactSection />
      <Footer />

      {/* Facebook Messenger Chat Button */}
      {/* <FacebookMessenger
        pageId={process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID || ''}
        themeColor="#0084FF"
      /> */}
    </main>
  );
}
