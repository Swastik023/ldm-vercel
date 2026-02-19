import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://ldm.edu.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "LDM College of Pharmacy | Diploma & Degree Pharmacy Programs",
    template: "%s | LDM College of Pharmacy",
  },
  description:
    "LDM College of Pharmacy offers government-approved Diploma and Degree programs in Pharmacy. Experienced faculty, modern labs, and 100% placement support.",
  keywords: [
    "LDM pharmacy college",
    "pharmacy college India",
    "D. Pharma",
    "B. Pharma",
    "Ayurvedic pharmacy",
    "pharmacy courses",
    "pharmacy admission",
  ],
  authors: [{ name: "LDM College of Pharmacy" }],
  creator: "LDM College of Pharmacy",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "LDM College of Pharmacy",
    title: "LDM College of Pharmacy | Diploma & Degree Pharmacy Programs",
    description:
      "Government-approved Pharmacy college offering D.Pharma, B.Pharma, and Ayurvedic Pharmacy programs with experienced faculty and modern infrastructure.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LDM College of Pharmacy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LDM College of Pharmacy",
    description:
      "Government-approved Pharmacy college offering D.Pharma, B.Pharma programs.",
    images: ["/og-image.jpg"],
  },
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
  alternates: {
    canonical: BASE_URL,
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
