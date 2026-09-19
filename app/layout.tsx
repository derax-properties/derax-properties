import type { Metadata } from "next";
import { Playfair_Display, Inter, Caveat } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.deraxrealestate.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Derax Real Estate | Derax Properties — Off-Market Real Estate Opportunities",
    template: "%s | Derax Properties",
  },
  description:
    "Derax Properties (Derax Real Estate) connects homeowners, investors, and buyers with distressed, off-market, and real estate investment opportunities nationwide.",
  keywords: [
    "Derax Properties",
    "Derax Real Estate",
    "off-market real estate",
    "distressed properties",
    "we buy houses",
    "real estate wholesaling",
  ],
  openGraph: {
    title: "Derax Real Estate | Derax Properties — Off-Market Real Estate Opportunities",
    description:
      "Derax Properties (Derax Real Estate) connects homeowners, investors, and buyers with distressed, off-market, and real estate investment opportunities nationwide.",
    url: siteUrl,
    siteName: "Derax Properties",
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
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${caveat.variable}`}>
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
