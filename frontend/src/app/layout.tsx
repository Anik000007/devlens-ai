import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/lib/query-client";

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#09090B" }],
  width: "device-width",
  initialScale: 1,
};

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DevLens AI — GitHub Contributor Intelligence Platform",
    template: "%s | DevLens AI",
  },
  description: "AI-powered GitHub analytics platform that analyzes developer profiles, visualizes contribution metrics, extracts skills, and generates professional summaries.",
  keywords: ["GitHub analytics", "developer insights", "AI", "open source", "portfolio"],
  openGraph: {
    title: "DevLens AI",
    description: "Understand any GitHub developer instantly with AI",
    type: "website",
    siteName: "DevLens AI",
  },
  twitter: { card: "summary_large_image", title: "DevLens AI", description: "AI-powered GitHub analytics" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
