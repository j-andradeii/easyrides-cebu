import type { Metadata } from "next";
import { Poppins, DM_Sans } from "next/font/google";
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
        className={`${poppins.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
