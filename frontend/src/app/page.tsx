import { Navbar } from "@/components/navbar";
import HeroSection from "@/components/hero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevLens AI — GitHub Contributor Intelligence Platform",
  description: "Analyze any GitHub profile with AI-powered analytics, skill insights, repository quality scores, and resume-ready achievements in seconds.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
    </>
  );
}
