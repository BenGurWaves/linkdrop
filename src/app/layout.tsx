import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://linkdrop.calyvent.com"),
  title: "LinkDrop — Elegant Link-in-Bio Pages",
  description:
    "Create a beautiful, minimalist link-in-bio page in seconds. Free forever with optional pro upgrades. No sign-up walls, no clutter — just your links, presented with quiet confidence.",
  keywords: [
    "elegant link in bio page free",
    "link in bio",
    "link-in-bio",
    "bio link page",
    "minimalist link page",
    "free link in bio",
    "linkdrop",
    "calyvent",
  ],
  openGraph: {
    title: "LinkDrop — Elegant Link-in-Bio Pages",
    description:
      "Create a beautiful, minimalist link-in-bio page in seconds. Free forever with optional pro upgrades.",
    url: "https://linkdrop.calyvent.com",
    siteName: "LinkDrop",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LinkDrop",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  description:
    "Create a beautiful, minimalist link-in-bio page in seconds. Free forever with optional pro upgrades.",
  url: "https://linkdrop.calyvent.com",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Free",
      description: "Free link-in-bio page with core features",
    },
    {
      "@type": "Offer",
      price: "5",
      priceCurrency: "USD",
      name: "Pro",
      description: "Pro link-in-bio page with custom domain, analytics, and themes",
    },
  ],
  creator: {
    "@type": "Organization",
    name: "Calyvent",
    url: "https://calyvent.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} ${spaceGrotesk.variable} min-h-full flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
