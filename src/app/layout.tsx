import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EasyRideCebu - Car Rentals and Tour Services",
  description: "Car rentals and tour services in Cebu. Easy and reliable transportation for your travel needs.",
  openGraph: {
    title: "EasyRideCebu - Car Rentals and Tour Services",
    description: "Car rentals and tour services in Cebu. Easy and reliable transportation for your travel needs.",
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
  twitter: {
    card: "summary_large_image",
    title: "EasyRideCebu - Car Rentals and Tour Services",
    description: "Car rentals and tour services in Cebu. Easy and reliable transportation for your travel needs.",
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
