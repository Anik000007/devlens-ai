"use client"
import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useInView, Variants } from "framer-motion"
import {
  Search, ArrowUpRight, Terminal, GitBranch, GitCommit, GitPullRequest,
  Activity, Star, Users, Zap, Shield, BarChart3, Sparkles, TrendingUp,
  Code2, GitFork, Brain, Command, LineChart,
} from "lucide-react"
import { BlurText } from "@/components/blur-text"
import { ThemeToggle } from "@/components/theme-toggle"

if (typeof window !== "undefined") {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (args[0] && typeof args[0] === "string" && args[0].includes("Framer Motion")) return
    originalError(...args)
  }
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const _previewRng = mulberry32(7)
const HEATMAP_DATA = Array.from({ length: 26 * 7 }, () =>
  _previewRng() > 0.55 ? Math.floor(_previewRng() * 4) + 1 : 0
)

const _sparkRng = mulberry32(11)
const SPARKLINE_DATA = {
  commits: Array.from({ length: 20 }, () => Math.floor(_sparkRng() * 100)),
  repos: Array.from({ length: 20 }, () => Math.floor(_sparkRng() * 80) + 20),
  stars: Array.from({ length: 20 }, () => Math.floor(_sparkRng() * 60) + 40),
  score: Array.from({ length: 20 }, () => Math.floor(_sparkRng() * 30) + 70),
}

const EXAMPLE_USERS = ["torvalds", "gaearon", "sindresorhus", "yyx990803"]

const AI_DNA = [
  { label: "Primary Role", value: "Systems Engineering Lead", color: "#A78BFA" },
  { label: "Code Quality Score", value: "94 / 100", color: "#10B981" },
  { label: "Open Source Impact", value: "98 / 100", color: "#F59E0B" },
  { label: "Polyglot Index", value: "7 languages", color: "#06B6D4" },
  { label: "Collaboration Style", value: "Mentor • PR Reviewer", color: "#EC4899" },
  { label: "Strengths", value: "Kernel internals, IO patterns, perf eng", color: "#A78BFA" },
]

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80
  const h = 24
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
    </svg>
  )
}

function HeatmapGrid() {
  const weeks = 26
  const days = 7
  const colors = ["transparent", "#1E1B4B", "#4C1D95", "#6D28D9", "#A78BFA"]
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: weeks }).map((_, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {Array.from({ length: days }).map((_, di) => {
            const val = HEATMAP_DATA[wi * days + di]
            return (
              <div
                key={di}
                className="w-3 h-3 rounded-[3px] transition-all"
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

type TabId = "pulse" | "heatmap" | "dna"

export function CinematicLanding() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("pulse")
  const [navHidden, setNavHidden] = useState(false)
  const lastScrollY = useRef(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY.current
      if (Math.abs(delta) < 5) return
      if (delta > 0 && currentScrollY > 80) setNavHidden(true)
      else if (delta < 0) setNavHidden(false)
      lastScrollY.current = currentScrollY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

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
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  }

  const itemVariants: Variants = {
    hidden: { filter: "blur(10px)", opacity: 0, y: 24 },
    show: {
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const TABS: { id: TabId; label: string; icon: typeof LineChart }[] = [
    { id: "pulse", label: "Pulse Dashboard", icon: LineChart },
    { id: "heatmap", label: "Activity Heatmap", icon: Activity },
    { id: "dna", label: "AI Code DNA", icon: Brain },
  ]

  return (
    <div className="bg-background text-foreground min-h-screen relative font-body overflow-x-hidden selection:bg-primary/20">
      {/* ── Ambient grid + color mesh (no video) ───────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            color: "var(--foreground)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
            maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full opacity-0 dark:opacity-[0.10] blur-[140px] bg-primary animate-breathe" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-0 dark:opacity-[0.07] blur-[120px] bg-accent animate-breathe" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* ── Header / Navbar ──────────────────────────── */}
      <header
        className={`fixed top-4 inset-x-0 z-50 px-4 md:px-8 lg:px-16 transition-transform duration-300 ease-out ${
          navHidden ? "-translate-y-[150%]" : "translate-y-0"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button onClick={() => router.push("/")} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7l9 5 9-5-9-5z" fill="white" />
                <path d="M3 17l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 12l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-heading font-bold text-base tracking-tight hidden sm:inline">DevLens AI</span>
          </button>

          <nav className="hidden md:flex items-center gap-0.5 liquid-glass rounded-xl p-1">
            {[
              { label: "Home", path: "/" },
              { label: "Explore", path: "/explore" },
              { label: "Compare", path: "/compare" },
              { label: "Features", path: "#capabilities" },
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
                className="px-3.5 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors rounded-lg cursor-pointer select-none"
              >
                {link.label}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="liquid-glass rounded-xl flex items-center justify-center">
              <ThemeToggle />
            </div>
            <button
              onClick={() => router.push("/explore")}
              className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              Get Started <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="mb-8 flex justify-center">
            <div className="liquid-glass rounded-full px-4 py-1.5 inline-flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs font-medium text-foreground/80">AI-Powered GitHub Intelligence</span>
              <span className="text-foreground/30">•</span>
              <span className="text-xs text-foreground/60">v1.0 Beta</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <BlurText
              text="Venture Past The Code, Map the Developer Universe"
              className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-foreground leading-[0.95] tracking-[-2px] justify-center"
            />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-foreground/60 font-body leading-relaxed max-w-2xl mx-auto mb-12"
          >
            DevLens AI transforms raw GitHub data into rich analytics, AI summaries, skill radar charts, and resume-ready achievements — in seconds.
          </motion.p>

          {/* Sleek glowing search */}
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto mb-6">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 rounded-2xl blur-xl opacity-30 group-focus-within:opacity-60 transition-opacity" />
              <div className="relative flex items-center gap-2 liquid-glass rounded-2xl p-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter any GitHub username..."
                    disabled={loading}
                    className="w-full bg-transparent h-12 pl-10 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-50"
                  />
                </div>
                <kbd className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-foreground/5 border border-border rounded-md px-2 py-1">
                  <Command className="w-3 h-3" /> K
                </kbd>
                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="h-12 px-5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {loading ? "Analyzing..." : "Analyze"}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <span className="mr-1">Try:</span>
              {EXAMPLE_USERS.map((user) => (
                <button
                  key={user}
                  onClick={() => handleExampleClick(user)}
                  className="px-2.5 py-1 rounded-md bg-foreground/5 hover:bg-primary/10 text-foreground/70 hover:text-primary border border-border hover:border-primary/30 transition-all"
                >
                  {user}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Interactive Dashboard Showcase */}
          <motion.div variants={itemVariants} className="mt-16 max-w-5xl mx-auto">
            <div className="liquid-glass-strong rounded-2xl overflow-hidden text-left shadow-2xl shadow-primary/5">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Terminal className="w-3 h-3" />
                    DevLens AI — Live Preview
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-foreground/5 rounded-lg p-1">
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeTab === id
                          ? "bg-foreground/10 text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-6 min-h-[280px]">
                <AnimatePresence mode="wait">
                  {activeTab === "pulse" && (
                    <motion.div
                      key="pulse"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                    >
                      {[
                        { label: "Commits", val: "1,247", color: "#A78BFA", data: SPARKLINE_DATA.commits },
                        { label: "Repos", val: "148", color: "#06B6D4", data: SPARKLINE_DATA.repos },
                        { label: "Stars", val: "92.3k", color: "#F59E0B", data: SPARKLINE_DATA.stars },
                        { label: "Score", val: "97/100", color: "#10B981", data: SPARKLINE_DATA.score },
                      ].map(({ label, val, color, data }) => (
                        <div key={label} className="flex flex-col gap-2 p-4 rounded-xl bg-foreground/[0.03] border border-border">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
                          <span className="text-2xl font-heading font-bold" style={{ color }}>{val}</span>
                          <Sparkline data={data} color={color} />
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === "heatmap" && (
                    <motion.div
                      key="heatmap"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span>Last 26 weeks</span>
                        <div className="flex items-center gap-2">
                          <span>Less</span>
                          <div className="flex gap-[2px]">
                            {["#1E1B4B", "#4C1D95", "#6D28D9", "#A78BFA"].map((c) => (
                              <div key={c} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <span>More</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto pb-1">
                        <HeatmapGrid />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-border text-xs">
                        <div><span className="text-muted-foreground">Total:</span> <span className="text-foreground font-semibold">3,841</span></div>
                        <div><span className="text-muted-foreground">Longest streak:</span> <span className="text-foreground font-semibold">52 days</span></div>
                        <div><span className="text-muted-foreground">Current:</span> <span className="text-foreground font-semibold">17 days</span></div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "dna" && (
                    <motion.div
                      key="dna"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      {AI_DNA.map(({ label, value, color }) => (
                        <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl bg-foreground/[0.03] border border-border">
                          <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
                            <div className="text-sm font-medium text-foreground break-words">{value}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Partner bar */}
          <motion.div variants={itemVariants} className="mt-20 flex flex-col items-center gap-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Mapping top developer ecosystems globally
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xl md:text-2xl text-foreground/30 font-heading font-bold tracking-tight">
              <span>GitHub</span>
              <span>GitLab</span>
              <span>VS Code</span>
              <span>npm</span>
              <span>Docker</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Row ───────────────────────────────── */}
      <section className="py-20 relative z-10 border-y border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
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
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="w-11 h-11 rounded-xl bg-foreground/5 border border-border flex items-center justify-center">
                <Icon className="w-5 h-5 text-foreground/70" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">
                {float ? `${value}${suffix}` : <><CountUp end={value} />{suffix}</>}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Capabilities ─────────────────────────────── */}
      <section id="capabilities" className="py-24 px-4 sm:px-6 lg:px-8 bg-background relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Capabilities</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-foreground tracking-[-2px] leading-[1.05]">
              Intelligence <span className="gradient-text">evolved</span>
            </h2>
            <p className="mt-4 text-foreground/60 text-sm sm:text-base max-w-xl mx-auto">
              Six lenses that turn raw GitHub data into a high-resolution picture of any developer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BarChart3, title: "Contribution Analytics", desc: "Deep-dive into commit history, language distribution, and coding patterns over time.", tags: ["Commit History", "Language Spread", "Coding Patterns", "Time Audit"] },
              { icon: Sparkles, title: "AI-Generated Insights", desc: "AI-powered developer summaries, role predictions, and skill assessments from code footprint.", tags: ["AI Summaries", "Role Prediction", "Skill Assessment", "Code DNA"] },
              { icon: Star, title: "Repo Quality Scores", desc: "Automated scoring for README quality, CI/CD setup, license configuration, and code health.", tags: ["README Check", "CI/CD Setup", "License Audit", "Health Score"] },
              { icon: TrendingUp, title: "Resume Generator", desc: "Transform raw GitHub activity into polished, achievement-focused resume bullets in one click.", tags: ["Resume Bullets", "Achievements", "Fast Exports", "Professional"] },
              { icon: Code2, title: "Skill Radar", desc: "Visual representation of language proficiency, framework focus, and codebase vector alignment.", tags: ["Radar Charts", "Language Focus", "Skill Mapping", "Visual DNA"] },
              { icon: Users, title: "Developer Compare", desc: "Side-by-side comparison of two developers with overlapping radars and team-fit signals.", tags: ["Side-by-Side", "Ecosystem Compare", "Interactive Radars", "Team Fit"] },
            ].map(({ icon: Icon, title, desc, tags }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="liquid-glass rounded-xl p-6 flex flex-col gap-4 group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 group-hover:from-primary/25 group-hover:to-accent/15 transition-all duration-300">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-md px-2 py-0.5 text-[10px] text-foreground/70 bg-foreground/5 border border-border whitespace-nowrap font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-2">
                  <h3 className="font-heading font-bold text-foreground text-xl tracking-[-0.5px]">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative z-10 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center rounded-2xl p-12 sm:p-16 relative overflow-hidden liquid-glass-strong"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
          <Sparkles className="relative w-10 h-10 text-primary mx-auto mb-5" />
          <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-bold font-heading mb-5 tracking-tight">
            Ready to chart your <span className="gradient-text">universe</span>?
          </h2>
          <p className="relative text-muted-foreground mb-8 text-sm sm:text-base max-w-lg mx-auto">
            Enter any GitHub username and receive a full developer-intelligence report in seconds.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/explore")}
              className="bg-gradient-to-r from-primary to-primary/80 text-white px-7 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              Explore Profiles <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/compare")}
              className="liquid-glass text-foreground px-7 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-foreground/5 transition-all"
            >
              Compare Developers
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-border py-14 px-4 sm:px-6 relative z-10 bg-background text-muted-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7l9 5 9-5-9-5z" fill="white" />
                    <path d="M3 17l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M3 12l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="font-bold text-foreground/80 font-heading text-lg">DevLens AI</span>
              </div>
              <p className="text-xs leading-relaxed max-w-[220px]">
                AI-powered GitHub analytics for developer insights and codebase intelligence.
              </p>
            </div>
            {[
              { title: "Product", links: [{ l: "Explore", p: "/explore" }, { l: "Compare", p: "/compare" }, { l: "Dashboard", p: "/dashboard" }] },
              { title: "Resources", links: [{ l: "Documentation", p: "#" }, { l: "API Docs", p: "#" }, { l: "Changelog", p: "#" }] },
              { title: "Legal", links: [{ l: "Privacy Policy", p: "#" }, { l: "Terms of Service", p: "#" }, { l: "Status", p: "#" }] },
            ].map(({ title, links }) => (
              <div key={title} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">{title}</p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.l}>
                      <span
                        onClick={() => link.p !== "#" && router.push(link.p)}
                        className="text-xs hover:text-foreground transition-colors cursor-pointer"
                      >
                        {link.l}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
            <span>© {new Date().getFullYear()} DevLens AI. Built for the future of code.</span>
            <span>Powered by Next.js, FastAPI &amp; Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
