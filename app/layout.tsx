import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://draviya.com"),
  title: {
    default: "Draviya | Invest in Creators",
    template: "%s | Draviya",
  },
  description:
    "We’re turning your favorite creators into Investable tokens(similar to stocks). Buy, sell, and grow with the creators you believe in.",
  keywords: [
    "Creator Economy",
    "Invest in Creators",
    "Creator Tokens",
    "Draviya",
    "Social Tokens",
  ],
  authors: [{ name: "Draviya Team" }],
  creator: "Draviya",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://draviya.com",
    title: "Draviya | Invest in Creators",
    description:
      "We’re turning your favorite creators into Investable tokens(similar to stocks). Buy, sell, and grow with the creators you believe in.",
    siteName: "Draviya",
    images: [
      {
        url: "/og-image.jpg", // Needs to be added to public folder later if not present
        width: 1200,
        height: 630,
        alt: "Draviya - Invest in Creators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Draviya | Invest in Creators",
    description:
      "We’re turning your favorite creators into Investable tokens(similar to stocks). Buy, sell, and grow with the creators you believe in.",
    images: ["/og-image.jpg"],
    creator: "@draviya",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${figtree.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Draviya",
              url: "https://draviya.com",
              logo: "https://draviya.com/images/logo/logo-icon.jpeg",
              sameAs: [
                "https://x.com/Draviyaofficial",
                "https://www.instagram.com/draviyaofficial",
                "https://github.com/draviyaofficial",
              ],
              description:
                "We’re turning your favorite creators into Investable tokens(similar to stocks). Buy, sell, and grow with the creators you believe in.",
            }),
          }}
        />
      </body>
    </html>
  );
}
