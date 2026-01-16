import {
  Navigation,
  HeroSection,
  ServicesSection,
  FleetSection,
  DriverBanner,
  ToursSection,
  TransferRatesSection,
  WhyChooseUs,
  ContactSection,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <main className="min-h-screen scroll-smooth overflow-x-hidden">
      <Navigation />
      <HeroSection />

      <ServicesSection />
      <FleetSection />
      <DriverBanner />
      <ToursSection />
      <TransferRatesSection />
      <WhyChooseUs />
      <ContactSection />

      <Footer />
    </main>
  );
}
