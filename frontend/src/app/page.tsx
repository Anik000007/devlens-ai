import { CinematicLanding } from "@/components/cinematic-landing"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DevLens AI — Celestial GitHub Intelligence",
  description: "Venture past the code across the developer universe. Get AI-powered analytics, skill radars, repository health, and resume bullets in seconds.",
}

export default function HomePage() {
  return <CinematicLanding />
}

