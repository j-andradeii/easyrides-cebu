import type { Metadata } from "next";
import { Poppins, DM_Sans } from "next/font/google";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primeicons/primeicons.css";
import "./globals.css";
import toursData from "@/data/tours.json";
import { servicesData } from "@/data/services";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.easyridecebutours.com"),

  // Primary title - 50-60 characters max
  title: {
    default: "EasyRideCebu - Affordable Car Rentals & Tours | Cebu",
    template: "%s | EasyRideCebu",
  },

  // Description - 150-160 characters with CTA
  description:
    "Book affordable car rentals and tour packages in Cebu. Airport transfers, city tours, Oslob whale sharks, Moalboal canyoneering. Easy online booking!",

  // Optimized keywords (most relevant, no duplicates)
  keywords: [
    "car rental cebu",
    "cebu tour package",
    "cebu city tour",
    "airport transfer cebu",
    "oslob whale shark tour",
    "moalboal canyoneering",
    "cebu south tour",
    "simala shrine tour",
    "cebu safari tour",
    "bohol countryside tour",
    "affordable car rental cebu",
    "cebu tour with driver",
    "van rental cebu",
    "sedan rental cebu",
    "suv rental cebu",
    "self-drive car rental cebu",
    "cebu travel package",
    "kawasan falls tour",
    "cebu highland tour",
    'easy car rental cebu',
    'easy ride cebu tours',
    'easy ride cebu',
    'easy car rental',
    'cebu car rental'
  ],

  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },

  openGraph: {
    title: "EasyRideCebu - Affordable Car Rentals & Tour Packages in Cebu",
    description:
      "Book affordable car rentals and tour packages in Cebu. Airport transfers, city tours, Oslob whale sharks, Moalboal. Easy online booking!",
    url: "https://www.easyridecebutours.com",
    siteName: "EasyRideCebu",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EasyRideCebu - Car Rentals and Tours in Cebu Philippines",
      },
    ],
    type: "website",
    locale: "en_US",
  },

  alternates: {
    canonical: "/",
  },

  twitter: {
    card: "summary_large_image",
    title: "EasyRideCebu - Affordable Car Rentals & Tours | Cebu",
    description:
      "Book affordable car rentals and tour packages in Cebu. Airport transfers, city tours, Oslob whale sharks, Moalboal. Easy online booking!",
    images: ["/logo.jpg"],
  },

  verification: {
    google: "ooM8CHcb0sg-rAI2cHyam1gcOC4TJoAdhKBmHHi7mHo",
  },

  // Robots directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden scroll-smooth">
      <body
        className={`${poppins.variable} ${dmSans.variable} antialiased overflow-x-hidden`}
      >
        <PrimeReactProvider>
          {children}
        </PrimeReactProvider>
        {/* LocalBusiness Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["AutoRental", "LocalBusiness", "TravelAgency"],
              "@id": "https://www.easyridecebutours.com/#business",
              name: "EasyRideCebu",
              alternateName: "Easy Ride Cebu Tours",
              description:
                "Affordable car rentals and tour packages in Cebu, Philippines. Offering airport transfers, city tours, and adventure packages.",
              image: "https://www.easyridecebutours.com/logo.jpg",
              logo: "https://www.easyridecebutours.com/logo.jpg",
              url: "https://www.easyridecebutours.com",
              telephone: "+639178046988",
              email: "easyridecebu2023@gmail.com",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Cebu City",
                addressLocality: "Cebu City",
                addressRegion: "Cebu",
                postalCode: "6000",
                addressCountry: "PH",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 10.3157,
                longitude: 123.8854,
              },
              areaServed: [
                { "@type": "City", name: "Cebu City" },
                { "@type": "City", name: "Mandaue" },
                { "@type": "City", name: "Lapu-Lapu" },
                { "@type": "City", name: "Mactan" },
                { "@type": "AdministrativeArea", name: "Cebu Province" },
                { "@type": "AdministrativeArea", name: "Bohol" },
              ],
              serviceArea: {
                "@type": "GeoCircle",
                geoMidpoint: {
                  "@type": "GeoCoordinates",
                  latitude: 10.3157,
                  longitude: 123.8854,
                },
                geoRadius: "150000",
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ],
                  opens: "08:00",
                  closes: "20:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Sunday",
                  opens: "09:00",
                  closes: "18:00",
                },
              ],
              priceRange: "$$",
              currenciesAccepted: "PHP",
              paymentAccepted: "Cash, GCash, Bank Transfer",
              sameAs: [
                "https://www.facebook.com/easyridecebu",
                "https://www.instagram.com/easyridecebu",
              ],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "EasyRideCebu Services",
                itemListElement: [
                  ...servicesData.map((service) => ({
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: service.title,
                      description: service.description,
                      url: `https://www.easyridecebutours.com${service.link}`,
                    },
                  })),
                  ...toursData.tours.map((tour) => ({
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "TouristTrip",
                      name: tour.title,
                      description: tour.shortDescription,
                      url: `https://www.easyridecebutours.com/tours/${tour.slug}`,
                    },
                  })),
                ],
              },
            }),
          }}
        />
        {/* FAQ Schema for common questions */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How much does a car rental in Cebu cost?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Car rental rates in Cebu start from ₱3,500 for sedans (1-3 pax), ₱4,500 for SUVs (4-6 pax), and ₱5,500-₱6,000 for vans (7-14 pax). All rates include driver, fuel, and hotel pickup/dropoff.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is included in EasyRideCebu tour packages?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "All tour packages include air-conditioned vehicle (sedan, SUV, or van), professional driver/guide who can also take photos, fuel, and hotel or airport pickup and dropoff. Entrance fees, parking fees, and meals are typically not included.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do you offer airport transfer services in Cebu?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, we offer airport transfer services from Mactan-Cebu International Airport to any hotel in Cebu City, Mandaue, or Lapu-Lapu City. We also provide transfers to ports like Hagnaya (for Bantayan Island) and Maya (for Malapascua Island).",
                  },
                },
                {
                  "@type": "Question",
                  name: "What are the most popular tours in Cebu?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Our most popular tours include: Oslob Whale Shark Encounter, Moalboal Sardines & Canyoneering, Cebu City & Uphill Tour (Temple of Leah, Tops Busay), Simala Shrine Visit, and Cebu Safari Adventure. Each tour can be customized based on your preferences.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I book a tour or car rental with EasyRideCebu?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "You can book directly through our website by filling out the inquiry form, or contact us via phone at +639178046988 or through our social media pages. We recommend booking at least 1-2 days in advance, especially during peak season.",
                  },
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
