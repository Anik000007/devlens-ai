"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, Sparkles, BarChart3, Star, GitFork, Users,
  Zap, ArrowRight, Code2, TrendingUp, Shield, GitBranch,
  Terminal, GitCommit, GitPullRequest, Activity,
} from "lucide-react"
import { MiniChart } from "@/components/mini-chart"
import { stagger, fadeInUp } from "@/components/page-transition"

const EXAMPLE_USERS = ["torvalds", "gaearon", "sindresorhus", "yyx990803"]
const FEATURES = [
  { icon: BarChart3, title: "Contribution Analytics", description: "Deep-dive into commit history, language distribution, and coding patterns over time.", gradient: "from-violet-500 to-indigo-600", color: "#6366F1" },
  { icon: Sparkles, title: "AI-Generated Insights", description: "Get AI-powered developer summaries, role predictions, and skill assessments.", gradient: "from-teal-500 to-cyan-500", color: "#14B8A6" },
  { icon: Star, title: "Repo Quality Scores", description: "Automated scoring for README quality, CI/CD setup, license, and documentation.", gradient: "from-amber-500 to-orange-500", color: "#f59e0b" },
  { icon: TrendingUp, title: "Resume Bullet Generator", description: "Transform raw GitHub data into polished, achievement-focused resume bullets.", gradient: "from-pink-500 to-rose-500", color: "#ec4899" },
  { icon: Code2, title: "Skill Radar", description: "Visual skill map showing language proficiency, frameworks, and tool usage.", gradient: "from-blue-500 to-indigo-500", color: "#3b82f6" },
  { icon: Users, title: "Developer Compare", description: "Side-by-side comparison of two GitHub profiles with detailed breakdowns.", gradient: "from-emerald-500 to-teal-500", color: "#10b981" },
]
const STATS = [
  { value: "50K+", label: "Profiles Analyzed", icon: Users },
  { value: "1M+", label: "Repos Scanned", icon: GitFork },
  { value: "99.9%", label: "Uptime", icon: Shield },
  { value: "<2s", label: "Analysis Speed", icon: Zap },
]
const HEATMAP_DATA = Array.from({ length: 52 * 7 }, (_, i) => Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0)
const ACTIVITY_PREVIEW = [
  { icon: GitCommit, text: "Merged 3 pull requests to linux/kernel", time: "2h ago", color: "#6366F1" },
  { icon: GitBranch, text: "Created branch feature/io-uring-v2", time: "5h ago", color: "#14B8A6" },
  { icon: Star, text: "Starred tensorflow/tensorflow", time: "1d ago", color: "#f59e0b" },
  { icon: GitPullRequest, text: "Reviewed PR #94821 — mm: fix page fault", time: "1d ago", color: "#10b981" },
  { icon: Activity, text: "74 contributions in the last month", time: "Stats", color: "#ec4899" },
]

function HeatmapPreview() {
  const weeks = 18
  const days = 7
  const data = Array.from({ length: weeks * days }, (_, i) =>
    Math.random() > 0.55 ? Math.floor(Math.random() * 4) + 1 : 0
  )
  const colors = ["transparent", "#1e2a4a", "#3730a3", "#4f46e5", "#818cf8"]
  return (
    <div className="flex gap-1">
      {Array.from({ length: weeks }).map((_, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {Array.from({ length: days }).map((_, di) => {
            const val = data[wi * days + di]
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
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

export default function HeroSection() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    router.push(`/profile/${username.trim()}`)
  }

  return (
    <main className="flex-1 overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden hero-grid">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.4, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-60 -right-60 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)" }}
          />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium text-primary border border-primary/30">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AI-Powered GitHub Intelligence Platform
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.05]">
            Analyze any GitHub
            <br />
            <span className="gradient-text">developer with AI</span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
            DevLens AI transforms raw GitHub data into rich analytics, AI summaries,
            skill radar charts, and resume-ready achievements — in seconds.
          </motion.p>

          {/* Search */}
          <motion.form variants={fadeInUp} onSubmit={handleSearch} id="hero-search-form" className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto">
            <div className="relative flex-1 w-full">
              <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="hero-username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter any GitHub username..."
                className="pl-10 h-13 text-base bg-card border-border/60 focus-visible:ring-primary rounded-2xl w-full"
              />
            </div>
            <Button id="hero-analyze-btn" type="submit" size="lg" disabled={loading}
              className="h-13 px-7 rounded-2xl font-semibold glow text-base whitespace-nowrap">
              {loading ? (
                <><svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg> Analyzing...</>
              ) : (<><Search className="w-4 h-4 mr-2" /> Analyze</>)}
            </Button>
          </motion.form>

          {/* Example users */}
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            {EXAMPLE_USERS.map((u) => (
              <button key={u} id={`example-${u}`} onClick={() => { setUsername(u); router.push(`/profile/${u}`) }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm bg-secondary hover:bg-primary/15 hover:text-primary border border-border/50 transition-all">
                <GitBranch className="w-3 h-3" />{u}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mt-16 max-w-3xl mx-auto px-4 w-full"
        >
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur overflow-hidden shadow-2xl">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground">
                <Terminal className="w-3 h-3" />
                DevLens AI — Profile Analysis
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Heatmap */}
              <div className="sm:col-span-2 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contribution Activity</p>
                <HeatmapPreview />
              </div>
              {/* Quick stats */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Stats</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Commits", val: "1,247", color: "#6366F1" },
                    { label: "Repos", val: "148", color: "#14B8A6" },
                    { label: "Stars", val: "92.3k", color: "#f59e0b" },
                    { label: "Score", val: "97/100", color: "#10b981" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-bold" style={{ color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity preview */}
            <div className="border-t border-border px-4 py-3 space-y-2">
              {ACTIVITY_PREVIEW.map(({ icon: Icon, text, time, color }, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                  <span className="text-muted-foreground flex-1 truncate">{text}</span>
                  <span className="text-muted-foreground/50 shrink-0">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats ──────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 50000, suffix: "+", label: "Profiles Analyzed", icon: Users },
            { value: 1000000, suffix: "+", label: "Repos Scanned", icon: GitFork },
            { value: 99.9, suffix: "%", label: "Uptime", icon: Shield, float: true },
            { value: 2, suffix: "s avg", label: "Analysis Speed", icon: Zap },
          ].map(({ value, suffix, label, icon: Icon, float }) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold gradient-text">
                {float ? `${value}${suffix}` : <><CountUp end={value} />{suffix}</>}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to understand a developer
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            From raw GitHub activity to polished AI insights — all in one platform.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map(({ icon: Icon, title, description, gradient, color }) => (
            <motion.div
              key={title}
              variants={fadeInUp}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent" />
              </div>
              <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all" style={{ color }}>
                Learn more <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-3xl p-10 sm:p-16 relative overflow-hidden border border-primary/20"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(20,184,166,0.05))" }}
        >
          <div className="absolute inset-0 hero-grid opacity-30 pointer-events-none" />
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to analyze?</h2>
          <p className="text-muted-foreground mb-8 text-base sm:text-lg">
            Enter any GitHub username and get a full developer intelligence report in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button id="cta-explore-btn" size="lg" className="rounded-2xl px-8 glow font-semibold">
              <a href="/explore">Explore Developers <ArrowRight className="w-4 h-4 ml-2" /></a>
            </Button>
            <Button id="cta-compare-btn" size="lg" variant="outline" className="rounded-2xl px-8 font-semibold border-border hover:border-primary/40">
              <a href="/compare">Compare Devs</a>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center glow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7l9 5 9-5-9-5z" fill="white"/><path d="M3 17l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <span className="font-bold gradient-text">DevLens AI</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">AI-powered GitHub analytics for developers, recruiters, and teams.</p>
            </div>
            {[
              { title: "Product", links: ["Explore", "Dashboard", "Compare", "API"] },
              { title: "Resources", links: ["Documentation", "Blog", "Changelog", "Status"] },
              { title: "Company", links: ["About", "Privacy", "Terms", "Contact"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</p>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} DevLens AI. Built for developers.</span>
            <span>Made with ♥ using Next.js, FastAPI & AI</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
