"use client"
import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { AIInsightPanel } from "@/components/ai-insight-panel"
import { fetchRepoAnalysis, type RepoAnalysis } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, GitBranch, Star, GitFork, Shield, FileText, Zap, Activity, Code2, ExternalLink, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

function StatusIcon({ status }: { status: string }) {
  if (status === "pass") return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
  if (status === "fail") return <XCircle className="w-4 h-4 text-red-400 shrink-0" />
  return <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
}

function QualityGauge({ score }: { score: number }) {
  const color = score >= 90 ? "#10b981" : score >= 75 ? "#6366F1" : score >= 60 ? "#f59e0b" : "#ef4444"
  const circumference = 2 * Math.PI * 52
  const dash = (score / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          <motion.circle cx="64" cy="64" r="52" fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            transform="rotate(-90 64 64)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-semibold" style={{ color }}>
        {score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 60 ? "Fair" : "Needs Work"}
      </p>
    </div>
  )
}

export default function RepoPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = use(params)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [data, setData] = useState<RepoAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetchRepoAnalysis(owner, repo)
        if (!cancelled) {
          setData(res)
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load repository data")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [owner, repo])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
          <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 pt-20 pb-8 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error Loading Repository</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
          <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 pt-20 pb-8 flex items-center justify-center">
             <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-sm font-medium">Analyzing repository {owner}/{repo}...</p>
             </div>
          </main>
        </div>
      </div>
    )
  }

  const r = data
  const passCount = r.checks.filter(c => c.status === "pass").length
  const warnCount = r.checks.filter(c => c.status === "warn").length
  const failCount = r.checks.filter(c => c.status === "fail").length

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
        <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <GitBranch className="w-4 h-4" />
                <span>{r.owner} / <span className="font-semibold text-foreground">{r.name}</span></span>
              </div>
              <p className="text-muted-foreground text-sm">{r.description}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3 h-3" />{r.stars.toLocaleString()}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{r.forks.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{r.license || "No License"}</span>
                {r.language && <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px]">{r.language}</span>}
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-border hover:border-primary/40 shrink-0" asChild>
              <a href={r.html_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> View on GitHub
              </a>
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quality checks */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Quality Checks</h2>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />{passCount} Pass
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      <AlertCircle className="w-3 h-3" />{warnCount} Warn
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      <XCircle className="w-3 h-3" />{failCount} Fail
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {r.checks.map((check, i) => (
                    <motion.div key={check.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <StatusIcon status={check.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{check.label}</p>
                        <p className="text-xs text-muted-foreground">{check.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Commit activity */}
              {r.commit_activity.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold flex items-center gap-2 mb-5"><Activity className="w-4 h-4 text-primary" /> Recent Commit Activity</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={r.commit_activity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }} />
                      <Bar dataKey="commits" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* AI Review */}
              {r.ai_review && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <AIInsightPanel
                    summary={r.ai_review}
                    strengths={r.ai_suggestions.length > 0 ? r.ai_suggestions : undefined}
                    role="AI Repository Review"
                  />
                </motion.div>
              )}
            </div>

            {/* Right */}
            <div className="space-y-6">
              {/* Quality gauge */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center gap-2">
                <h2 className="font-semibold text-sm w-full flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-primary" />Quality Score</h2>
                <QualityGauge score={r.quality_score} />
              </motion.div>

              {/* Top contributors */}
              {r.contributors.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold flex items-center gap-2 mb-4"><Code2 className="w-4 h-4 text-primary" /> Top Contributors</h2>
                  <div className="space-y-3">
                    {r.contributors.map((c, i) => (
                      <a key={c.name} href={`/profile/${c.name}`} className="flex items-center gap-3 hover:bg-secondary/50 p-2 rounded-xl transition-colors cursor-pointer group">
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                        <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium group-hover:underline truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.commits.toLocaleString()} commits</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h2 className="font-semibold text-sm flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-primary" />Repo Stats</h2>
                {[
                  { label: "Stars", value: r.stars.toLocaleString(), icon: Star },
                  { label: "Forks", value: r.forks.toLocaleString(), icon: GitFork },
                  { label: "Watchers", value: r.watchers.toLocaleString(), icon: Activity },
                  { label: "Language", value: r.language || "Unknown", icon: Code2 },
                  { label: "License", value: r.license || "None", icon: Shield },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
