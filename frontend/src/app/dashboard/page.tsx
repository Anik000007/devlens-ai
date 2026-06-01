"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { AIInsightPanel } from "@/components/ai-insight-panel"
import { LanguageBar } from "@/components/language-bar"
import { StatCard } from "@/components/stat-card"
import { useUserAnalytics, useAISummary } from "@/lib/hooks"
import {
  LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Star, Users, GitFork, Zap, Activity, Calendar, FileText, Search, Loader2, AlertCircle, Code2, Trophy
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = ["#7C3AED", "#06B6D4", "#F59E0B", "#EC4899", "#10B981"]

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [searchInput, setSearchInput] = useState("torvalds")
  const [username, setUsername] = useState("torvalds")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setUsername(searchInput.trim())
    }
  }

  const { data: analytics, isLoading, error } = useUserAnalytics(username)
  const { data: aiData } = useAISummary({
    username: analytics?.username || "",
    name: analytics?.name || "",
    bio: analytics?.bio,
    top_languages: analytics?.top_languages,
    total_stars: analytics?.total_stars,
    followers: analytics?.followers,
    repos: analytics?.repo_count,
    created_at: analytics?.created_at,
  }, !!analytics)

  const loading = isLoading
  const err = error?.message || ""

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
        <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Dashboard Header & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Real-time GitHub analytics</p>
            </motion.div>
            
            <motion.form 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSearch} 
              className="flex w-full sm:w-auto items-center gap-2"
            >
              <div className="relative flex-1 sm:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Analyze user..."
                  className="pl-9 h-10 bg-secondary/50 border-border/50 rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/30"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/15 hover:shadow-primary/25 px-5 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
              </Button>
            </motion.form>
          </div>

{err && (
              <div className="p-8 text-center border border-red-500/15 bg-red-500/5 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 font-medium text-sm">Error loading user: {err}</p>
              </div>
           )}

           {!err && loading && (
            <div className="flex-1 flex items-center justify-center py-24">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            </div>
          )}

          {!err && !loading && analytics && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Profile header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 rounded-2xl border border-border/50 bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/3 pointer-events-none" />
                <img src={analytics.avatar} alt={analytics.name} className="relative w-16 h-16 rounded-2xl ring-2 ring-primary/20 shadow-lg object-cover" />
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-heading">{analytics.name}</h2>
                    {aiData && (
                      <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-semibold border border-primary/15">
                        {aiData.role_prediction}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">@{analytics.username} {analytics.company ? `· ${analytics.company}` : ''}</p>
                  <p className="text-sm text-muted-foreground/60 mt-1 line-clamp-2">{analytics.bio}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users className="w-5 h-5" />} label="Followers" value={analytics.followers} accent delay={0} />
                <StatCard icon={<GitFork className="w-5 h-5" />} label="Repositories" value={analytics.repo_count} delay={0.05} />
                <StatCard icon={<Star className="w-5 h-5" />} label="Total Stars" value={analytics.total_stars} delay={0.1} />
                <StatCard icon={<Zap className="w-5 h-5" />} label="Open Source Score" value={`${analytics.open_source_score}/100`} accent delay={0.15} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Commit chart */}
                  {analytics.commit_history.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="rounded-2xl border border-border/50 bg-card p-5">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold flex items-center gap-2 font-heading"><Activity className="w-4 h-4 text-primary" /> Commit History</h2>
                        <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">Last 12 months</span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={analytics.commit_history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "12px" }} />
                          <Line type="monotone" dataKey="commits" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3, fill: "#7C3AED" }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}

                  {/* Repositories */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-border/50 bg-card p-5">
                    <h2 className="font-semibold flex items-center gap-2 mb-4 font-heading"><Code2 className="w-4 h-4 text-primary" /> Top Repositories</h2>
                    <div className="space-y-3">
                      {analytics.top_repos.slice(0, 4).map((repo) => (
                        <a key={repo.name} href={`/repo/${analytics.username}/${repo.name}`} className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-primary/10 transition-all duration-200 cursor-pointer group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary group-hover:underline truncate">{repo.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-3 shrink-0">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars.toLocaleString()}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${getScoreColor(repo.score)}15`, color: getScoreColor(repo.score) }}>
                              {repo.score}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </motion.div>

                  {/* Skills radar */}
                  {aiData && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                      className="rounded-2xl border border-border/50 bg-card p-5">
                      <h2 className="font-semibold flex items-center gap-2 mb-4 font-heading"><Trophy className="w-4 h-4 text-primary" /> Skill Radar</h2>
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={aiData.skills}>
                          <PolarGrid stroke="rgba(255,255,255,0.05)" />
                          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#71717A" }} />
                          <Radar name="Skills" dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  {/* Language pie */}
                  {analytics.language_stats.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                      className="rounded-2xl border border-border/50 bg-card p-5">
                      <h2 className="font-semibold flex items-center gap-2 mb-4 font-heading"><FileText className="w-4 h-4 text-primary" /> Languages</h2>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={analytics.language_stats} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                            dataKey="percentage" nameKey="name" paddingAngle={2}>
                            {analytics.language_stats.map((lang, i) => (
                              <Cell key={lang.name} fill={lang.color || COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "12px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <LanguageBar languages={analytics.language_stats} compact />
                    </motion.div>
                  )}

                  {/* AI Insights */}
                  {aiData && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <AIInsightPanel summary={aiData.summary.slice(0, 200) + "..."} strengths={aiData.strengths.slice(0, 4)} role={aiData.role_prediction} />
                    </motion.div>
                  )}

                  {/* Scores */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
                    <h2 className="font-semibold flex items-center gap-2 font-heading"><Calendar className="w-4 h-4 text-primary" /> Scores</h2>
                    {[
                      { label: "Consistency", value: analytics.consistency_score, color: "#7C3AED" },
                      { label: "Collaboration", value: analytics.collaboration_score, color: "#06B6D4" },
                      { label: "Open Source", value: analytics.open_source_score, color: "#F59E0B" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <span className="font-bold text-xs font-heading" style={{ color }}>{value}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

function getScoreColor(score: number) {
  if (score >= 90) return "#10B981"
  if (score >= 75) return "#7C3AED"
  if (score >= 60) return "#F59E0B"
  return "#EF4444"
}
