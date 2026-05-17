"use client"
import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { AIInsightPanel } from "@/components/ai-insight-panel"
import { LanguageBar } from "@/components/language-bar"
import { StatCard } from "@/components/stat-card"
import { SkeletonCard } from "@/components/skeleton-card"
import {
  fetchUserAnalytics, fetchAISummary, fetchResumePoints,
  type UserAnalytics, type AISummary,
} from "@/lib/api"
import {
  LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Users, Star, GitFork, Zap, MapPin, Building2, Link, Download,
  GitBranch, Activity, FileText, Code2, Trophy, AlertCircle, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = ["#6366F1", "#14B8A6", "#f59e0b", "#ec4899"]

// Progress steps for the loading indicator
const LOAD_STEPS = [
  "Fetching profile...",
  "Loading repositories...",
  "Calculating analytics...",
  "Generating AI summary...",
  "Building resume bullets...",
]

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data states
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [aiData, setAiData] = useState<AISummary | null>(null)
  const [resumeBullets, setResumeBullets] = useState<string[]>([])

  // Loading / error
  const [loading, setLoading] = useState(true)
  const [loadStep, setLoadStep] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!username) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      setLoadStep(0)

      try {
        // Step 1-3: Fetch analytics (includes profile + repos + scores)
        setLoadStep(0)
        const analyticsData = await fetchUserAnalytics(username)
        if (cancelled) return
        setAnalytics(analyticsData)
        setLoadStep(3)

        // Step 4: AI summary
        const ai = await fetchAISummary({
          username: analyticsData.username,
          name: analyticsData.name,
          bio: analyticsData.bio,
          top_languages: analyticsData.top_languages,
          total_stars: analyticsData.total_stars,
          followers: analyticsData.followers,
          repos: analyticsData.repo_count,
          created_at: analyticsData.created_at,
        })
        if (cancelled) return
        setAiData(ai)
        setLoadStep(4)

        // Step 5: Resume bullets
        const resume = await fetchResumePoints({
          username: analyticsData.username,
          name: analyticsData.name,
          repos_data: analyticsData.top_repos.map(r => ({
            name: r.name,
            description: r.description,
            stars: r.stars,
          })),
          total_stars: analyticsData.total_stars,
          top_languages: analyticsData.top_languages,
        })
        if (cancelled) return
        setResumeBullets(resume.bullets)
        setLoadStep(5)
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load profile")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [username])

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
          <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 pt-20 pb-8 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4 max-w-md mx-auto px-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h2 className="text-xl font-bold">User not found</h2>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" className="rounded-xl" onClick={() => window.history.back()}>
                ← Go Back
              </Button>
            </motion.div>
          </main>
        </div>
      </div>
    )
  }

  // Loading state with step indicator
  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
          <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 pt-20 pb-8 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center space-y-6 max-w-sm mx-auto px-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Analyzing @{username}</p>
                <div className="space-y-1.5">
                  {LOAD_STEPS.map((step, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-2 text-xs transition-all duration-300",
                      i < loadStep ? "text-emerald-400" : i === loadStep ? "text-primary" : "text-muted-foreground/40"
                    )}>
                      {i < loadStep ? "✓" : i === loadStep ? <Loader2 className="w-3 h-3 animate-spin" /> : "○"} {step}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    )
  }

  const d = analytics
  const predictedRole = aiData?.role_prediction || "Developer"
  const strengths = aiData?.strengths || d.top_languages.slice(0, 3)
  const aiSummary = aiData?.summary || `${d.name} is an active developer with expertise in ${d.top_languages.slice(0, 3).join(", ")}.`
  const skills = aiData?.skills || [
    { skill: "Backend", value: 50 },
    { skill: "Frontend", value: 50 },
    { skill: "Systems", value: 50 },
    { skill: "Open Source", value: 50 },
    { skill: "DevOps", value: 50 },
    { skill: "Data/ML", value: 50 },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
        <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 pt-20 pb-8">
          {/* Hero banner */}
          <div className="relative overflow-hidden border-b border-border mb-8">
            <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                <div className="relative">
                  <img src={d.avatar} alt={d.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-primary/30 shadow-2xl object-cover" />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary text-white shadow-lg">
                    {d.open_source_score}
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold">{d.name}</h1>
                    <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      {predictedRole}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">@{d.username}</p>
                  <p className="text-sm text-muted-foreground/80 max-w-2xl">{d.bio}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {d.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.location}</span>}
                    {d.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{d.company}</span>}
                    {d.blog && <span className="flex items-center gap-1"><Link className="w-3 h-3" />{d.blog.replace("https://", "")}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="rounded-xl border-border hover:border-primary/40" asChild>
                    <a href={d.html_url} target="_blank" rel="noopener noreferrer">
                      <GitBranch className="w-4 h-4 mr-2" /> View on GitHub
                    </a>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-5 h-5" />} label="Followers" value={d.followers} accent delay={0} />
              <StatCard icon={<GitFork className="w-5 h-5" />} label="Repositories" value={d.repo_count} delay={0.05} />
              <StatCard icon={<Star className="w-5 h-5" />} label="Stars Earned" value={d.total_stars} delay={0.1} />
              <StatCard icon={<Zap className="w-5 h-5" />} label="OSS Score" value={`${d.open_source_score}/100`} accent delay={0.15} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Summary */}
                <AIInsightPanel summary={aiSummary} strengths={strengths} role={predictedRole} />

                {/* Resume bullets */}
                {resumeBullets.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Resume Bullets</h2>
                      <Button size="sm" variant="outline" className="text-xs rounded-xl h-8"
                        onClick={() => navigator.clipboard.writeText(resumeBullets.join("\n• "))}>
                        <Download className="w-3 h-3 mr-1" /> Copy All
                      </Button>
                    </div>
                    <ul className="space-y-3">
                      {resumeBullets.map((b, i) => (
                        <motion.li key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                          className="flex gap-3 text-sm text-muted-foreground leading-relaxed group cursor-pointer hover:text-foreground transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                          {b}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Commit chart */}
                {d.commit_history.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="font-semibold flex items-center gap-2 mb-5"><Activity className="w-4 h-4 text-primary" /> Commit Activity</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={d.commit_history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }} />
                        <Line type="monotone" dataKey="commits" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366F1" }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Repos */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold flex items-center gap-2 mb-4"><Code2 className="w-4 h-4 text-primary" /> Top Repositories</h2>
                  <div className="space-y-3">
                    {d.top_repos.map((repo) => (
                      <a key={repo.name} href={repo.html_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors cursor-pointer group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary group-hover:underline truncate">{repo.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{repo.stars.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><GitFork className="w-2.5 h-2.5" />{repo.forks.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground">{repo.language}</span>
                          </div>
                        </div>
                        <div className="ml-3 shrink-0 text-right">
                          <div className="text-sm font-bold" style={{ color: repo.score >= 90 ? "#10b981" : repo.score >= 75 ? "#6366F1" : "#f59e0b" }}>
                            {repo.score}
                          </div>
                          <div className="text-[9px] text-muted-foreground">Quality</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right */}
              <div className="space-y-6">
                {/* Languages */}
                {d.language_stats.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="font-semibold flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-primary" /> Languages</h2>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={d.language_stats} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                          dataKey="percentage" nameKey="name" paddingAngle={2}>
                          {d.language_stats.map((lang, i) => (
                            <Cell key={lang.name} fill={lang.color || COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <LanguageBar languages={d.language_stats} compact />
                  </motion.div>
                )}

                {/* Skill Radar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-primary" /> Skill Radar</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={skills}>
                      <PolarGrid stroke="rgba(255,255,255,0.07)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Radar name="Skills" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Scores */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Impact Scores</h2>
                  {[
                    { label: "Consistency", value: d.consistency_score, color: "#6366F1" },
                    { label: "Collaboration", value: d.collaboration_score, color: "#14B8A6" },
                    { label: "Open Source", value: d.open_source_score, color: "#f59e0b" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground text-xs">{label}</span>
                        <span className="font-bold text-xs" style={{ color }}>{value}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
                          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full" style={{ backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
