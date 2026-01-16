import type { Metadata } from "next";
import { Poppins, DM_Sans } from "next/font/google";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primeicons/primeicons.css";
import "./globals.css";

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
  description: "Car rentals and tour services in Cebu. Easy and reliable transportation for your travel needs.",
  keywords: [
    "Easy",
    "Ride",
    "Cebu",
    "Cebu Tours",
    "Easy Cebu Car Rentals",
    "Easy Tour Package",
    "Easy Rentals",
    'Easy Ride Cebu',
    'EasyRideCebu',
    'Easy Airport Transfer Cebu',
    'Easy Tour Package Cebu',
    'Easy Vios Car Rental',
    'Vios Car Rental Cebu',
    'Sedan Car Rental Cebu',
    'SUV Car Rental Cebu',
    'Van Car Rental Cebu',
    'Easy Self-Driving Car Rental Cebu',
    'Cebu Car Rental',
    'Cebu Tour Package',
    'Cebu Tour'
  ],
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "EasyRideCebu - Car Rentals and Tour Services",
    description: "Car rentals and tour services in Cebu. Easy and reliable transportation for your travel needs.",
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
    description: "Car rentals and tour services in Cebu. Easy and reliable transportation for your travel needs.",
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
      </body>
    </html>
  );
}
