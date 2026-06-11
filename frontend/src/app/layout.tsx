import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/lib/query-client";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://devlens.vercel.app";
const SITE_NAME = "DevLens AI";
const SITE_DESCRIPTION =
  "AI-powered GitHub analytics platform that analyzes developer profiles, visualizes contribution metrics, extracts skills, and generates professional summaries.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
  ],
  width: "device-width",
  initialScale: 1,
};

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — GitHub Contributor Intelligence Platform`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "GitHub analytics",
    "developer insights",
    "AI",
    "open source",
    "portfolio",
    "recruiter pipeline",
    "skill radar",
    "career simulator",
    "developer intelligence",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: "DevLens AI" }],
  creator: "DevLens AI",
  publisher: "DevLens AI",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    title: `${SITE_NAME} — Map the Developer Universe`,
    description: "Understand any GitHub developer instantly with AI-generated summaries, skill radars, and code DNA analysis.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — GitHub Intelligence`,
    description: "AI-powered analytics that turn raw GitHub data into actionable developer insights.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "AI-generated developer summaries",
    "Contribution analytics",
    "Skill radar charts",
    "Repository quality scoring",
    "Recruiter talent pipeline",
    "Career path simulator",
    "Open-source issue matching",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script
          id="json-ld-webapp"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <KeyboardShortcutsProvider>
              {children}
            </KeyboardShortcutsProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
