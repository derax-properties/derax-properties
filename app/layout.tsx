import type { Metadata } from "next";
import { Playfair_Display, Inter, Caveat, Lobster, Oswald, Special_Elite } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lobster",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-special-elite",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.deraxrealestate.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DERAX REAL ESTATE LLC — Off-Market Real Estate Opportunities",
    template: "%s | DERAX REAL ESTATE LLC",
  },
  description:
    "DERAX REAL ESTATE LLC connects homeowners, investors, and buyers with distressed, off-market, and real estate investment opportunities nationwide.",
  keywords: [
    "DERAX REAL ESTATE LLC",
    "off-market real estate",
    "distressed properties",
    "we buy houses",
    "real estate wholesaling",
  ],
  openGraph: {
    title: "DERAX REAL ESTATE LLC — Off-Market Real Estate Opportunities",
    description:
      "DERAX REAL ESTATE LLC connects homeowners, investors, and buyers with distressed, off-market, and real estate investment opportunities nationwide.",
    url: siteUrl,
    siteName: "DERAX REAL ESTATE LLC",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${caveat.variable} ${lobster.variable} ${oswald.variable} ${specialElite.variable}`}
    >
      <body className="font-body text-ink antialiased bg-cream-soft">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-gold focus:text-ink focus:px-4 focus:py-2 focus:rounded-md"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
