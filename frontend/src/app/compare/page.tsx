"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { AIInsightPanel } from "@/components/ai-insight-panel"
import { LanguageBar } from "@/components/language-bar"
import { compareUsers, type CompareResult } from "@/lib/api"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GitBranch, GitCompare, Users, Star, GitFork, Trophy, Download, Link2, Loader2, AlertCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type CompareMetricKey = "followers" | "repos" | "total_stars" | "open_source_score" | "consistency_score" | "collaboration_score"

const COMPARE_METRICS: { key: CompareMetricKey; label: string; icon: typeof Users }[] = [
  { key: "followers", label: "Followers", icon: Users },
  { key: "repos", label: "Repositories", icon: GitFork },
  { key: "total_stars", label: "Stars", icon: Star },
  { key: "open_source_score", label: "OSS Score", icon: Zap },
  { key: "consistency_score", label: "Consistency", icon: GitBranch },
  { key: "collaboration_score", label: "Collaboration", icon: Users },
]

const COLORS_A = "#6366F1"
const COLORS_B = "#14B8A6"

export default function ComparePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userA, setUserA] = useState("")
  const [userB, setUserB] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<CompareResult | null>(null)

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userA.trim() || !userB.trim()) return

    setLoading(true)
    setError("")
    
    try {
      const data = await compareUsers(userA.trim(), userB.trim())
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Failed to compare developers")
    } finally {
      setLoading(false)
    }
  }

  const devA = result?.developer_a
  const devB = result?.developer_b

  // Build chart data
  const chartData = []
  if (devA && devB && devA.commit_history && devB.commit_history) {
    const months = devA.commit_history.map(d => d.month)
    for (let i = 0; i < months.length; i++) {
      chartData.push({
        month: months[i],
        [devA.username]: devA.commit_history[i]?.commits || 0,
        [devB.username]: devB.commit_history[i]?.commits || 0,
      })
    }
  }

  const radarData = []
  if (devA && devB && devA.skills && devB.skills) {
    for (let i = 0; i < devA.skills.length; i++) {
      radarData.push({
        skill: devA.skills[i].skill,
        [devA.username]: devA.skills[i].value,
        [devB.username]: devB.skills[i]?.value || 0,
      })
    }
  }

  function getWinner(metric: CompareMetricKey) {
    if (!devA || !devB) return "tie"
    const a = devA[metric] ?? 0
    const b = devB[metric] ?? 0
    if (a > b) return "A"
    if (b > a) return "B"
    return "tie"
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
        <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <GitCompare className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">Compare Developers</h1>
            </div>
            <p className="text-sm text-muted-foreground">Side-by-side AI-powered developer comparison</p>
          </motion.div>

          {/* Input form */}
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onSubmit={handleCompare}
            className="flex flex-col sm:flex-row items-center gap-3 mb-8 p-4 rounded-2xl border border-border bg-card">
            <div className="relative flex-1 w-full">
              <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={userA} onChange={(e) => setUserA(e.target.value)}
                placeholder="First GitHub username (e.g. torvalds)..." className="pl-9 h-11 bg-secondary border-border rounded-xl" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
              <div className="w-px h-6 bg-border hidden sm:block" />
              <span className="text-sm font-medium text-muted-foreground">vs</span>
              <div className="w-px h-6 bg-border hidden sm:block" />
            </div>
            <div className="relative flex-1 w-full">
              <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={userB} onChange={(e) => setUserB(e.target.value)}
                placeholder="Second GitHub username (e.g. gaearon)..." className="pl-9 h-11 bg-secondary border-border rounded-xl" />
            </div>
            <Button type="submit" disabled={loading} className="h-11 px-6 rounded-xl font-semibold glow whitespace-nowrap shrink-0">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitCompare className="w-4 h-4 mr-2" />} 
              Compare
            </Button>
          </motion.form>

          {error && (
             <div className="p-8 mb-8 text-center border border-red-500/20 bg-red-500/10 rounded-2xl max-w-lg mx-auto">
               <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
               <p className="text-red-400 font-medium">{error}</p>
             </div>
          )}

          {!result && !loading && !error && (
             <div className="p-16 text-center border border-border bg-card/50 rounded-3xl">
               <GitCompare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
               <h2 className="text-xl font-medium mb-2">Ready to compare</h2>
               <p className="text-muted-foreground max-w-md mx-auto">
                 Enter two GitHub usernames above to see a detailed side-by-side analysis, including metrics, skill radars, and AI insights.
               </p>
             </div>
          )}

          {result && devA && devB && (
            <div className="space-y-6">
              {/* Profile cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[{ dev: devA, color: COLORS_A, label: "Developer A" }, { dev: devB, color: COLORS_B, label: "Developer B" }].map(({ dev, color, label }) => (
                  <motion.div key={dev.username} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border bg-card p-5 space-y-4"
                    style={{ borderColor: `${color}40`, boxShadow: `0 0 30px ${color}15` }}>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ backgroundColor: `${color}20`, color }}>{label}</span>
                       <a href={`/profile/${dev.username}`} className="text-xs text-muted-foreground hover:text-foreground hover:underline">View Full Profile &rarr;</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={dev.avatar} alt={dev.name} className="w-14 h-14 rounded-2xl border-2 object-cover" style={{ borderColor: color }} />
                      <div>
                        <p className="font-bold">{dev.name}</p>
                        <p className="text-sm text-muted-foreground">@{dev.username}</p>
                      </div>
                    </div>
                    <LanguageBar languages={dev.languages} compact />
                  </motion.div>
                ))}
              </div>

              {/* Head to head metrics */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold mb-5 flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Head-to-Head</h2>
                <div className="space-y-4">
                  {COMPARE_METRICS.map(({ key, label, icon: Icon }) => {
                    const valA = devA[key] ?? 0
                    const valB = devB[key] ?? 0
                    const winner = getWinner(key)
                    const total = valA + valB || 1
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className={cn("font-semibold tabular-nums", winner === "A" && "text-[#6366F1]")}>{valA.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</span>
                          <span className={cn("font-semibold tabular-nums", winner === "B" && "text-[#14B8A6]")}>{valB.toLocaleString()}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-secondary/50">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(valA / total) * 100}%` }}
                            transition={{ delay: 0.3, duration: 0.7 }}
                            className={cn("h-full rounded-l-full transition-all", winner === "A" ? "opacity-100" : "opacity-40")}
                            style={{ backgroundColor: COLORS_A }} />
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(valB / total) * 100}%` }}
                            transition={{ delay: 0.3, duration: 0.7 }}
                            className={cn("h-full rounded-r-full transition-all", winner === "B" ? "opacity-100" : "opacity-40")}
                            style={{ backgroundColor: COLORS_B }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Radar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold mb-4">Skill Comparison</h2>
                  <div className="flex gap-4 text-xs mb-2">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_A }} />{devA.username}</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_B }} />{devB.username}</div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.07)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Radar name={devA.username} dataKey={devA.username} stroke={COLORS_A} fill={COLORS_A} fillOpacity={0.2} strokeWidth={2} />
                      <Radar name={devB.username} dataKey={devB.username} stroke={COLORS_B} fill={COLORS_B} fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Commit comparison */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold mb-4">Contribution Timeline</h2>
                  <div className="flex gap-4 text-xs mb-2">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_A }} />{devA.username}</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_B }} />{devB.username}</div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "11px" }} />
                      <Line type="monotone" dataKey={devA.username} stroke={COLORS_A} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey={devB.username} stroke={COLORS_B} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* AI Summary */}
              {result.ai_analysis && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <AIInsightPanel
                    summary={result.ai_analysis}
                    strengths={["Balanced Analysis", "Data-driven Comparison"]}
                    role="AI Comparison Review"
                  />
                </motion.div>
              )}

              {/* Export */}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-xl border-border hover:border-primary/40"
                  onClick={() => {
                    const text = [
                      `DevLens AI — Developer Comparison`,
                      `================================`,
                      ``,
                      `${devA.name} (@${devA.username}) vs ${devB.name} (@${devB.username})`,
                      ``,
                      `--- Metrics ---`,
                      ...COMPARE_METRICS.map(m => {
                        const a = devA[m.key] ?? 0;
                        const b = devB[m.key] ?? 0;
                        return `${m.label}:  ${a}  vs  ${b}`;
                      }),
                      ``,
                      `--- Top Languages ---`,
                      `A: ${devA.top_language_names.join(", ")}`,
                      `B: ${devB.top_language_names.join(", ")}`,
                      ``,
                      `--- AI Analysis ---`,
                      result.ai_analysis,
                      ``,
                      `Generated by DevLens AI — ${window.location.href}`,
                    ].join("\n");
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `compare-${devA.username}-vs-${devB.username}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                  <Download className="w-4 h-4 mr-2" /> Export Report
                </Button>
                <Button variant="outline" className="rounded-xl border-border hover:border-primary/40"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  <Link2 className="w-4 h-4 mr-2" /> Copy Link
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
