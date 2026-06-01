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

const COLORS_A = "#7C3AED"
const COLORS_B = "#06B6D4"

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare developers")
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
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <GitCompare className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold font-heading">Compare Developers</h1>
            </div>
            <p className="text-sm text-muted-foreground">Side-by-side AI-powered developer comparison</p>
          </motion.div>

          {/* Input form */}
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onSubmit={handleCompare}
            className="flex flex-col sm:flex-row items-center gap-3 mb-8 p-5 rounded-2xl border border-border/50 bg-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED08] via-transparent to-[#06B6D408] pointer-events-none" />
            <div className="relative flex-1 w-full group">
              <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#7C3AED] transition-colors" />
              <Input value={userA} onChange={(e) => setUserA(e.target.value)}
                placeholder="First GitHub username (e.g. torvalds)..." className="pl-9 h-11 bg-secondary/50 border-border/50 rounded-xl focus-visible:ring-[#7C3AED]/30 focus-visible:border-[#7C3AED]/30" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
              <div className="w-px h-6 bg-border/50 hidden sm:block" />
              <span className="text-sm font-bold font-heading gradient-text">VS</span>
              <div className="w-px h-6 bg-border/50 hidden sm:block" />
            </div>
            <div className="relative flex-1 w-full group">
              <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#06B6D4] transition-colors" />
              <Input value={userB} onChange={(e) => setUserB(e.target.value)}
                placeholder="Second GitHub username (e.g. gaearon)..." className="pl-9 h-11 bg-secondary/50 border-border/50 rounded-xl focus-visible:ring-[#06B6D4]/30 focus-visible:border-[#06B6D4]/30" />
            </div>
            <Button type="submit" disabled={loading} className="relative h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent shadow-md shadow-primary/15 hover:shadow-primary/25 whitespace-nowrap shrink-0 transition-all">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitCompare className="w-4 h-4 mr-2" />} 
              Compare
            </Button>
          </motion.form>

          {error && (
             <div className="p-8 mb-8 text-center border border-red-500/15 bg-red-500/5 rounded-2xl max-w-lg mx-auto">
               <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
               <p className="text-red-400 font-medium text-sm">{error}</p>
             </div>
          )}

          {!result && !loading && !error && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-16 text-center border border-border/50 bg-card/50 rounded-3xl"
             >
               <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-5">
                 <GitCompare className="w-8 h-8 text-muted-foreground/40" />
               </div>
               <h2 className="text-xl font-semibold mb-2 font-heading">Ready to compare</h2>
               <p className="text-muted-foreground text-sm max-w-md mx-auto">
                 Enter two GitHub usernames above to see a detailed side-by-side analysis, including metrics, skill radars, and AI insights.
               </p>
             </motion.div>
          )}

          {result && devA && devB && (
            <div className="space-y-6">
              {/* Profile cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[{ dev: devA, color: COLORS_A, label: "Developer A" }, { dev: devB, color: COLORS_B, label: "Developer B" }].map(({ dev, color, label }) => (
                  <motion.div key={dev.username} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border bg-card p-5 space-y-4 relative overflow-hidden"
                    style={{ borderColor: `${color}25` }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${color}06, transparent)` }} />
                    <div className="relative flex items-center justify-between">
                       <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${color}12`, color }}>{label}</span>
                       <a href={`/profile/${dev.username}`} className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">&rarr; Full Profile</a>
                    </div>
                    <div className="relative flex items-center gap-3">
                      <img src={dev.avatar} alt={dev.name} className="w-14 h-14 rounded-2xl border-2 object-cover" style={{ borderColor: `${color}40` }} />
                      <div>
                        <p className="font-bold font-heading">{dev.name}</p>
                        <p className="text-sm text-muted-foreground">@{dev.username}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <LanguageBar languages={dev.languages} compact />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Head to head metrics */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border/50 bg-card p-5">
                <h2 className="font-semibold mb-5 flex items-center gap-2 font-heading"><Trophy className="w-4 h-4 text-primary" /> Head-to-Head</h2>
                <div className="space-y-4">
                  {COMPARE_METRICS.map(({ key, label, icon: Icon }) => {
                    const valA = devA[key] ?? 0
                    const valB = devB[key] ?? 0
                    const winner = getWinner(key)
                    const total = valA + valB || 1
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className={cn("font-semibold tabular-nums font-heading", winner === "A" && "text-[#A78BFA]")}>{valA.toLocaleString()}</span>
                          <span className="flex items-center gap-1.5"><Icon className="w-3 h-3" /> {label}</span>
                          <span className={cn("font-semibold tabular-nums font-heading", winner === "B" && "text-[#06B6D4]")}>{valB.toLocaleString()}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-secondary/40">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(valA / total) * 100}%` }}
                            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className={cn("h-full rounded-l-full transition-all", winner === "A" ? "opacity-100" : "opacity-35")}
                            style={{ background: `linear-gradient(90deg, ${COLORS_A}, ${COLORS_A}80)` }} />
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(valB / total) * 100}%` }}
                            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className={cn("h-full rounded-r-full transition-all", winner === "B" ? "opacity-100" : "opacity-35")}
                            style={{ background: `linear-gradient(90deg, ${COLORS_B}80, ${COLORS_B})` }} />
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
                  className="rounded-2xl border border-border/50 bg-card p-5">
                  <h2 className="font-semibold mb-4 font-heading">Skill Comparison</h2>
                  <div className="flex gap-4 text-xs mb-3">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_A }} />{devA.username}</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_B }} />{devB.username}</div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#71717A" }} />
                      <Radar name={devA.username} dataKey={devA.username} stroke={COLORS_A} fill={COLORS_A} fillOpacity={0.15} strokeWidth={2} />
                      <Radar name={devB.username} dataKey={devB.username} stroke={COLORS_B} fill={COLORS_B} fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Commit comparison */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="rounded-2xl border border-border/50 bg-card p-5">
                  <h2 className="font-semibold mb-4 font-heading">Contribution Timeline</h2>
                  <div className="flex gap-4 text-xs mb-3">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_A }} />{devA.username}</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_B }} />{devB.username}</div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "11px" }} />
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
                <Button variant="outline" className="rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
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
                <Button variant="outline" className="rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
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
