"use client"
import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView, Variants } from "framer-motion"
import {
  Search, Clock, Globe, ArrowUpRight, Play, Terminal, GitBranch,
  GitCommit, GitPullRequest, Activity, Star, Users, Zap, Shield,
  BarChart3, Sparkles, TrendingUp, Code2, GitFork
} from "lucide-react"
import { FadingVideo } from "@/components/fading-video"
import { BlurText } from "@/components/blur-text"
import { ThemeToggle } from "@/components/theme-toggle"

// Suppress benign Framer Motion list key warnings if any
if (typeof window !== "undefined") {
  const originalError = console.error
  console.error = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Framer Motion')) return
    originalError(...args)
  }
}

// Deterministic seeded PRNG to avoid SSR/client hydration mismatch
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Pre-compute deterministic heatmap preview data
const _previewRng = mulberry32(7)
const HEATMAP_PREVIEW_DATA = Array.from({ length: 18 * 7 }, () =>
  _previewRng() > 0.55 ? Math.floor(_previewRng() * 4) + 1 : 0
)

const EXAMPLE_USERS = ["torvalds", "gaearon", "sindresorhus", "yyx990803"]

const ACTIVITY_PREVIEW = [
  { icon: GitCommit, text: "Merged 3 pull requests to linux/kernel", time: "2h ago", color: "#818cf8" },
  { icon: GitBranch, text: "Created branch feature/io-uring-v2", time: "5h ago", color: "#14B8A6" },
  { icon: Star, text: "Starred tensorflow/tensorflow", time: "1d ago", color: "#f59e0b" },
  { icon: GitPullRequest, text: "Reviewed PR #94821 — mm: fix page fault", time: "1d ago", color: "#10b981" },
  { icon: Activity, text: "74 contributions in the last month", time: "Stats", color: "#ec4899" },
]

function HeatmapPreview() {
  const weeks = 18
  const days = 7
  const colors = ["transparent", "#1e2a4a", "#3730a3", "#4f46e5", "#818cf8"]
  return (
    <div className="flex gap-1">
      {Array.from({ length: weeks }).map((_, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {Array.from({ length: days }).map((_, di) => {
            const val = HEATMAP_PREVIEW_DATA[wi * days + di]
            return (
              <div
                key={di}
                className="w-2.5 h-2.5 rounded-sm transition-all"
                style={{ backgroundColor: colors[val] || colors[0], opacity: val === 0 ? 0.15 : 1 }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1500
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end])
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export function CinematicLanding() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    router.push(`/profile/${username.trim()}`)
  }

  const handleExampleClick = (name: string) => {
    setUsername(name)
    setLoading(true)
    router.push(`/profile/${name}`)
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { filter: "blur(10px)", opacity: 0, y: 20 },
    show: {
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  return (
    <div className="bg-black text-white min-h-screen relative font-body overflow-x-hidden selection:bg-white/20">
      
      {/* ── Fixed Navbar ────────────────────────────────── */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Circle */}
          <button
            onClick={() => router.push("/")}
            className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center font-heading italic text-2xl text-white select-none hover:bg-white/10 transition-colors cursor-pointer"
          >
            d
          </button>

          {/* Links and CTA Pill (Desktop Only) */}
          <nav className="hidden md:flex items-center gap-1.5 liquid-glass rounded-full p-1.5">
            {[
              { label: "Home", path: "/" },
              { label: "Voyages", path: "/explore" },
              { label: "Worlds", path: "/compare" },
              { label: "Innovation", path: "#capabilities" },
            ].map((link) => (
              <span
                key={link.label}
                onClick={() => {
                  if (link.path.startsWith("#")) {
                    document.getElementById(link.path.substring(1))?.scrollIntoView({ behavior: "smooth" })
                  } else {
                    router.push(link.path)
                  }
                }}
                className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors cursor-pointer select-none"
              >
                {link.label}
              </span>
            ))}
            <button
              onClick={() => router.push("/explore")}
              className="bg-white text-black px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-white/90 transition-all select-none cursor-pointer"
            >
              Claim a Spot <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </nav>

          {/* Invisible spacer to balance layout */}
          <div className="w-12 h-12 md:flex hidden items-center justify-center liquid-glass rounded-full">
            <ThemeToggle />
          </div>
          
          {/* Claim a Spot on mobile */}
          <button
            onClick={() => router.push("/explore")}
            className="md:hidden bg-white text-black px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-white/90 transition-all select-none cursor-pointer"
          >
            Claim a Spot <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Section 1: Hero ────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background Video */}
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: "120%", height: "120%" }}
        />
        
        {/* Gradient Overlay for Video Contrast */}
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/70 to-black z-0 pointer-events-none" />

        {/* Hero Centered Content Area */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-col items-center justify-center pt-32 pb-16 text-center max-w-4xl mx-auto px-4 w-full"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="liquid-glass rounded-full px-4 py-1.5 inline-flex items-center gap-2">
              <span className="bg-white text-black px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                New
              </span>
              <span className="text-xs text-white/90 pr-1">
                AI-Powered GitHub Intelligence Platform
              </span>
            </div>
          </motion.div>

          {/* Headline (BlurText) */}
          <motion.div variants={itemVariants} className="mb-6 w-full">
            <BlurText
              text="Venture Past The Code Across The Universe"
              className="text-5xl sm:text-6xl lg:text-7xl font-heading italic text-white leading-[0.85] tracking-[-3px] font-normal justify-center text-center"
            />
          </motion.div>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base text-white/80 font-body font-light leading-relaxed max-w-2xl mx-auto mb-8"
          >
            DevLens AI transforms raw GitHub data into rich analytics, AI summaries, skill radar charts, and resume-ready achievements — in seconds. Mapped and visualized for builders and creators.
          </motion.p>

          {/* Search Form */}
          <motion.div variants={itemVariants} className="w-full max-w-xl mx-auto space-y-4 mb-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter any GitHub username..."
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 rounded-full liquid-glass text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-12 px-6 rounded-full bg-white text-black text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/95 transition-all shrink-0 cursor-pointer w-full sm:w-auto"
              >
                {loading ? "Analyzing..." : "Start Voyage"}{" "}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>

            {/* Try examples */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/60">
              <span>Try:</span>
              {EXAMPLE_USERS.map((user) => (
                <button
                  key={user}
                  onClick={() => handleExampleClick(user)}
                  className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors"
                >
                  {user}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Terminal Heatmap Preview Card (Centered below search controls) */}
          <motion.div
            variants={itemVariants}
            className="w-full max-w-3xl mx-auto mb-10 text-left"
          >
            <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden shadow-2xl liquid-glass-strong">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <div className="flex items-center gap-1.5 ml-2 text-[10px] uppercase tracking-wider text-white/50">
                  <Terminal className="w-3 h-3" />
                  DevLens AI — Profile Preview
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Heatmap */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                    Contribution Activity
                  </p>
                  <div className="overflow-x-auto scrollbar-none py-1">
                    <HeatmapPreview />
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                    Live Pulse
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {[
                      { label: "Commits", val: "1,247", color: "#818cf8" },
                      { label: "Repos", val: "148", color: "#14B8A6" },
                      { label: "Stars", val: "92.3k", color: "#f59e0b" },
                      { label: "Score", val: "97/100", color: "#10b981" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="flex flex-col gap-1 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white/40 text-[10px] uppercase">{label}</span>
                        <span className="font-bold text-base" style={{ color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity preview */}
                <div className="border-t border-white/5 pt-3 space-y-2">
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Recent Universe Events
                  </p>
                  <div className="space-y-2">
                    {ACTIVITY_PREVIEW.map(({ icon: Icon, text, time, color }, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                        <span className="text-white/70 flex-1 truncate">{text}</span>
                        <span className="text-white/40 shrink-0">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-6 w-full mb-16"
          >
            {/* Stat 1 */}
            <div className="p-4 w-[220px] rounded-[1.25rem] liquid-glass flex flex-col items-center text-center gap-3 select-none">
              <Clock className="w-6 h-6 text-white/80 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-3xl font-heading italic text-white tracking-[-1px] leading-none">
                  1.2 Sec
                </span>
                <span className="text-[10px] text-white/60 font-body font-light mt-1.5 leading-tight">
                  Average Profile Analysis Speed
                </span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-4 w-[220px] rounded-[1.25rem] liquid-glass flex flex-col items-center text-center gap-3 select-none">
              <Globe className="w-6 h-6 text-white/80 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-3xl font-heading italic text-white tracking-[-1px] leading-none">
                  2.8B+
                </span>
                <span className="text-[10px] text-white/60 font-body font-light mt-1.5 leading-tight">
                  Commits Mapped Worldwide
                </span>
              </div>
            </div>
          </motion.div>

          {/* Partners Bar */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-4 w-full"
          >
            <div className="liquid-glass rounded-full px-3.5 py-1 text-[10px] font-medium text-white/50 uppercase tracking-wider">
              Mapping top developer ecosystems globally
            </div>
            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 font-heading italic text-2xl md:text-3xl text-white/80 select-none font-normal">
              <span>Aeon</span>
              <span>Vela</span>
              <span>Apex</span>
              <span>Orbit</span>
              <span>Zeno</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Section 2: Real Stats Counter ───────────────── */}
      <section className="py-20 relative z-10 border-y border-white/5 bg-black/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 50000, suffix: "+", label: "Profiles Mapped", icon: Users },
            { value: 1000000, suffix: "+", label: "Repos Scanned", icon: GitFork },
            { value: 99.9, suffix: "%", label: "Scanner Uptime", icon: Shield, float: true },
            { value: 2, suffix: "s avg", label: "Analysis Speed", icon: Zap },
          ].map(({ value, suffix, label, icon: Icon, float }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white/80" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-heading italic tracking-wider">
                {float ? `${value}${suffix}` : <><CountUp end={value} />{suffix}</>}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-white/50">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Capabilities (min-h-screen) ──────── */}
      <section id="capabilities" className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-black">
        {/* Background Video */}
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        
        {/* Gradient Overlay for Capabilities Video */}
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/70 to-black z-0 pointer-events-none" />

        {/* Content Overlay */}
        <div className="relative z-10 px-6 md:px-16 lg:px-20 pt-28 pb-12 flex flex-col min-h-screen max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-auto">
            <p className="text-xs uppercase tracking-widest font-semibold text-white/50 mb-4 select-none">
              // Capabilities
            </p>
            <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px] select-none font-normal">
              Intelligence
              <br />
              evolved
            </h2>
          </div>

          {/* Capabilities Grid (6 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            
            {/* Card 1: Contribution Analytics */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[350px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-[0.75rem] liquid-glass shrink-0">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["Commit History", "Language Spread", "Coding Patterns", "Time Audit"].map((tag) => (
                    <span key={tag} className="liquid-glass rounded-full px-2.5 py-0.5 text-[9px] text-white/80 font-body whitespace-nowrap font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl tracking-[-1px] leading-none font-normal">
                  Contribution Analytics
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-white/70 font-body font-light leading-snug">
                  Deep-dive into commit history, language distribution, and coding patterns over time. Mapped clearly.
                </p>
              </div>
            </div>

            {/* Card 2: AI-Generated Insights */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[350px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-[0.75rem] liquid-glass shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["AI Summaries", "Role Prediction", "Skill Assessment", "Code DNA"].map((tag) => (
                    <span key={tag} className="liquid-glass rounded-full px-2.5 py-0.5 text-[9px] text-white/80 font-body whitespace-nowrap font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl tracking-[-1px] leading-none font-normal">
                  AI-Generated Insights
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-white/70 font-body font-light leading-snug">
                  Get AI-powered developer summaries, role predictions, and skill assessments directly from code footprint.
                </p>
              </div>
            </div>

            {/* Card 3: Repo Quality Scores */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[350px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-[0.75rem] liquid-glass shrink-0">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["README Check", "CI/CD Setup", "License Audit", "Health Score"].map((tag) => (
                    <span key={tag} className="liquid-glass rounded-full px-2.5 py-0.5 text-[9px] text-white/80 font-body whitespace-nowrap font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl tracking-[-1px] leading-none font-normal">
                  Repo Quality Scores
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-white/70 font-body font-light leading-snug">
                  Automated scoring for README quality, CI/CD setup, license configurations, and overall code health.
                </p>
              </div>
            </div>

            {/* Card 4: Resume Bullet Generator */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[350px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-[0.75rem] liquid-glass shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["Resume Bullets", "Achievement Mapping", "Fast Exports", "Professional"].map((tag) => (
                    <span key={tag} className="liquid-glass rounded-full px-2.5 py-0.5 text-[9px] text-white/80 font-body whitespace-nowrap font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl tracking-[-1px] leading-none font-normal">
                  Resume Generator
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-white/70 font-body font-light leading-snug">
                  Transform raw GitHub activity data into polished, achievement-focused resume bullets in one click.
                </p>
              </div>
            </div>

            {/* Card 5: Skill Radar */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[350px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-[0.75rem] liquid-glass shrink-0">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["Radar Charts", "Language Focus", "Skill Mapping", "Visual DNA"].map((tag) => (
                    <span key={tag} className="liquid-glass rounded-full px-2.5 py-0.5 text-[9px] text-white/80 font-body whitespace-nowrap font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl tracking-[-1px] leading-none font-normal">
                  Skill Radar
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-white/70 font-body font-light leading-snug">
                  Visual representation showing language proficiency, framework focus, and deep codebase vector alignment.
                </p>
              </div>
            </div>

            {/* Card 6: Developer Compare */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[350px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-[0.75rem] liquid-glass shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["Side-by-Side", "Ecosystem Compare", "Interactive Radars", "Overlaps"].map((tag) => (
                    <span key={tag} className="liquid-glass rounded-full px-2.5 py-0.5 text-[9px] text-white/80 font-body whitespace-nowrap font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl tracking-[-1px] leading-none font-normal">
                  Developer Compare
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-white/70 font-body font-light leading-snug">
                  Side-by-side comparison of two developers with radar overlapping charts and automated team fits.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 4: CTA ────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative z-10 bg-black">
        <div
          className="max-w-4xl mx-auto text-center rounded-4xl p-12 sm:p-20 relative overflow-hidden liquid-glass-strong border border-white/10"
        >
          <Sparkles className="w-10 h-10 text-white mx-auto mb-6" />
          <h2 className="text-4xl sm:text-5xl font-bold font-heading italic mb-6">
            Ready to chart your universe?
          </h2>
          <p className="text-white/70 mb-10 text-sm sm:text-base max-w-lg mx-auto font-body font-light">
            Enter any GitHub username to launch your developer intelligence analysis and receive a full cosmic report.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/explore")}
              className="bg-white text-black px-8 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-all select-none cursor-pointer"
            >
              Explore Mapped Profiles <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/compare")}
              className="liquid-glass text-white px-8 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/10 border border-white/15 transition-all select-none cursor-pointer"
            >
              Compare Developers
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 relative z-10 bg-black text-white/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-heading italic text-lg text-white select-none">
                  d
                </div>
                <span className="font-semibold text-white/90 font-heading italic text-xl">DevLens AI</span>
              </div>
              <p className="text-xs leading-relaxed max-w-[200px]">
                AI-powered GitHub analytics for developer insights and codebase universe mapping.
              </p>
            </div>
            {[
              { title: "Product", links: [{ l: "Explore", p: "/explore" }, { l: "Compare", p: "/compare" }, { l: "API Docs", p: "#" }] },
              { title: "Ecosystem", links: [{ l: "Voyages", p: "/explore" }, { l: "Worlds", p: "/compare" }, { l: "Motive", p: "/" }] },
              { title: "Safety", links: [{ l: "Privacy Policy", p: "#" }, { l: "Terms of Launch", p: "#" }, { l: "Status", p: "#" }] },
            ].map(({ title, links }) => (
              <div key={title} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{title}</p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.l}>
                      <span
                        onClick={() => link.p !== "#" && router.push(link.p)}
                        className="text-xs hover:text-white transition-colors cursor-pointer"
                      >
                        {link.l}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px]">
            <span>© {new Date().getFullYear()} DevLens AI. Mapped for code frontiers.</span>
            <span>Created with Next.js, FastAPI & Space Age AI</span>
          </div>
        </div>
      </footer>
      
    </div>
  )
}
