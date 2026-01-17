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
  metadataBase: new URL("https://www.easyridecebutours.com/"),
  title: "EasyRideCebu - Car Rentals and Tour Services",
  description: "Booking your transportation and tours in Cebu just got easier, faster, and hassle-free. Designed to give you a smooth and convenient booking experience—no long chats, no confusion, just a few clicks and you’re set. Easy tour browsing, clear packages & rates, stress-free booking process, trusted & reliable service. Whether you’re planning a city tour, south Cebu adventure, or private transportation, we’ve got you covered from start to finish.",
  keywords: [
    "easyridecebu",
    "cebucarrental",
    "Cebu",
    "cebutour",
    "cebutransportation",
    "followerseveryone",
    "CebuSouthTour",
    "cebutourpackage",
    "cebucity",
    "cebucitytour",
    "Easy",
    "Ride",
    "Cebu Tours",
    "Easy Cebu Car Rentals",
    "Easy Tour Package",
    "Easy Rentals",
    "Easy Ride Cebu",
    "EasyRideCebu",
    "Easy Airport Transfer Cebu",
    "Easy Tour Package Cebu",
    "Easy Vios Car Rental",
    "Vios Car Rental Cebu",
    "Sedan Car Rental Cebu",
    "SUV Car Rental Cebu",
    "Van Car Rental Cebu",
    "Easy Self-Driving Car Rental Cebu",
    "Cebu Car Rental",
    "Cebu Tour Package",
    "Cebu Tour",
    'cebu car rentals',
    'cebu affordable car rental',
    'affordable car rental',
    'affordable tour package cebu',
    'cebu affordable tour package',
    'tour package moalboal',
    'easy car rental cebu',
    'Explore Cebu Your Way',
    'Explore cebu rent a car',
    'Explore cebu tours',
    ...servicesData.map((s) => s.title),
    ...servicesData.map((s) => s.description),
    ...servicesData.map((s) => s.shortTitle),
    ...toursData.tours.map((t) => t.title),
  ],
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "EasyRideCebu - Car Rentals and Tour Services",
    description: "Booking your transportation and tours in Cebu just got easier, faster, and hassle-free. Your EASY ride starts with EASY booking.",
    url: "https://www.easyridecebutours.com/",
    siteName: "EasyRideCebu",
    images: [
      {
        url: "/logo.jpg",
        width: 1024,
        height: 1024,
        alt: "EasyRideCebu Logo",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyRideCebu - Car Rentals and Tour Services",
    description: "Booking your transportation and tours in Cebu just got easier, faster, and hassle-free. Your EASY ride starts with EASY booking.",
    images: ["/logo.jpg"],
  },
  verification: {
    google: "ooM8CHcb0sg-rAI2cHyam1gcOC4TJoAdhKBmHHi7mHo",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["AutoRental", "LocalBusiness"],
              "name": "EasyRideCebu",
              "image": "https://www.easyridecebutours.com/logo.jpg",
              "@id": "https://www.easyridecebutours.com",
              "url": "https://www.easyridecebutours.com",
              "telephone": "+639178046988",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Cebu City",
                "addressCountry": "PH"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 10.3157,
                "longitude": 123.8854
              },
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                  ],
                  "opens": "08:00",
                  "closes": "20:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": "Sunday",
                  "opens": "09:00",
                  "closes": "18:00"
                }
              ],
              "priceRange": "₱₱",
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "EasyRideCebu Services",
                "itemListElement": [
                  ...servicesData.map((service) => ({
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": service.title,
                      "description": service.description,
                      "url": `https://www.easyridecebutours.com${service.link}`
                    }
                  })),
                  ...toursData.tours.map((tour) => ({
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": tour.title,
                      "description": tour.shortDescription,
                      "url": `https://www.easyridecebutours.com/tours/${tour.slug}`
                    }
                  }))
                ]
              }
            })
          }}
        />
      </body>
    </html>
  );
}
