"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, ResponsiveContainer,
} from "recharts"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, Trophy, Sparkles, Target, AlertCircle, Loader2,
  CheckCircle2, Circle, ExternalLink, GitPullRequest, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fetchUserAnalytics, fetchAISummary, fetchCareerPath, fetchCareerRoles, fetchProjectMatches,
  ApiError,
  type UserAnalytics, type AISummary, type CareerPath, type MatchResult, type CareerMilestone,
} from "@/lib/api"

const SKILL_AXES = ["Backend", "Frontend", "Systems", "Open Source", "DevOps", "Data/ML"]

function defaultSkills(): { skill: string; value: number }[] {
  return SKILL_AXES.map((s) => ({ skill: s, value: 50 }))
}

function mergeSkills(
  current: { skill: string; value: number }[] | undefined
): { skill: string; value: number }[] {
  const base = defaultSkills()
  if (!current) return base
  const lookup = new Map(current.map((s) => [s.skill, s.value]))
  return base.map((b) => ({ skill: b.skill, value: lookup.get(b.skill) ?? b.value }))
}

export default function CareerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Profile load
  const [usernameInput, setUsernameInput] = useState("")
  const [activeUsername, setActiveUsername] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState("")
  const [analyticsErrorStatus, setAnalyticsErrorStatus] = useState<number | null>(null)

  // Roles
  const [roles, setRoles] = useState<string[]>([])
  const [targetRole, setTargetRole] = useState<string>("")

  // Career path
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null)
  const [careerLoading, setCareerLoading] = useState(false)
  const [careerError, setCareerError] = useState("")

  // Simulated skills + project matches
  const [simulatedSkills, setSimulatedSkills] = useState(defaultSkills())
  const [matches, setMatches] = useState<MatchResult | null>(null)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesError, setMatchesError] = useState("")

  // Completed milestones (in-memory, keyed by username + title)
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  // Load available roles on mount
  useEffect(() => {
    let cancelled = false
    fetchCareerRoles()
      .then((res) => {
        if (cancelled) return
        setRoles(res.roles)
        if (res.roles[0]) setTargetRole((cur) => cur || res.roles[0])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Load analytics when activeUsername changes
  useEffect(() => {
    if (!activeUsername) return
    let cancelled = false
    setAnalyticsLoading(true)
    setAnalyticsError("")
    setAnalyticsErrorStatus(null)
    setAiSummary(null)
    fetchUserAnalytics(activeUsername)
      .then(async (data) => {
        if (cancelled) return
        setAnalytics(data)
        setCompleted(new Set())
        // Fetch AI summary in parallel for the current skills baseline
        try {
          const ai = await fetchAISummary({
            username: data.username,
            name: data.name,
            bio: data.bio,
            top_languages: data.top_languages,
            total_stars: data.total_stars,
            followers: data.followers,
            repos: data.repo_count,
            created_at: data.created_at,
          })
          if (!cancelled) {
            setAiSummary(ai)
            // Initialise the simulator from the AI baseline
            setSimulatedSkills(mergeSkills(ai.skills))
          }
        } catch {
          // AI is non-critical — fall back to defaults
          if (!cancelled) setSimulatedSkills(mergeSkills(undefined))
        }
      })
      .catch((err) => {
        if (cancelled) return
        setAnalyticsError(err instanceof Error ? err.message : "Failed to load profile")
        setAnalyticsErrorStatus(err instanceof ApiError ? err.status : null)
        setAnalytics(null)
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeUsername])

  // Fetch career path whenever profile + role are ready
  useEffect(() => {
    if (!analytics || !targetRole) return
    let cancelled = false
    setCareerLoading(true)
    setCareerError("")
    fetchCareerPath({
      username: analytics.username,
      name: analytics.name,
      top_languages: analytics.top_languages,
      total_stars: analytics.total_stars,
      followers: analytics.followers,
      repos: analytics.repo_count,
      skills: simulatedSkills,
      target_role: targetRole,
    })
      .then((data) => {
        if (cancelled) return
        setCareerPath(data)
      })
      .catch((err) => {
        if (cancelled) return
        setCareerError(err instanceof Error ? err.message : "Failed to load career path")
      })
      .finally(() => {
        if (!cancelled) setCareerLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics?.username, targetRole])

  // Debounced fetch of project matches whenever sliders change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!analytics) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setMatchesLoading(true)
      setMatchesError("")
      try {
        const res = await fetchProjectMatches({
          username: analytics.username,
          name: analytics.name,
          top_languages: analytics.top_languages,
          total_stars: analytics.total_stars,
          followers: analytics.followers,
          repos: analytics.repo_count,
          skills: simulatedSkills,
        })
        setMatches(res)
      } catch (err) {
        setMatchesError(err instanceof Error ? err.message : "Failed to load matches")
      } finally {
        setMatchesLoading(false)
      }
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics?.username, simulatedSkills])

  // Radar data: merge current + simulated by skill axis
  const radarData = useMemo(() => {
    const current = new Map(
      (aiSummary?.skills || []).map((s: { skill: string; value: number }) => [s.skill, s.value])
    )
    const simulated = new Map(simulatedSkills.map((s) => [s.skill, s.value]))
    return SKILL_AXES.map((axis) => ({
      skill: axis,
      current: current.get(axis) ?? 0,
      target: simulated.get(axis) ?? 0,
    }))
  }, [aiSummary?.skills, simulatedSkills])

  const handleLoadProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const u = usernameInput.trim()
    if (u) setActiveUsername(u)
  }

  const handleSliderChange = (skill: string, value: number) => {
    setSimulatedSkills((prev) =>
      prev.map((s) => (s.skill === skill ? { ...s, value } : s))
    )
  }

  const toggleMilestone = (title: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
        <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold font-heading">Career Simulator</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Pick a target role, drag the skill sliders, and explore how your trajectory shifts in real time.
            </p>
          </motion.div>

          {/* Profile loader */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onSubmit={handleLoadProfile}
            className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter a GitHub username to simulate..."
                className="pl-9 h-11 rounded-xl bg-card border-border/60"
              />
            </div>
            <Button type="submit" className="rounded-xl h-11 px-6">
              {analyticsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Load <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </motion.form>

          {/* Empty / loading / error */}
          {!activeUsername && !analytics && (
            <EmptyState
              icon={<Target className="w-7 h-7 text-muted-foreground" />}
              title="Pick a developer to simulate"
              description="Enter a GitHub username above. We'll load their current skill profile and let you simulate growth toward a target role."
            />
          )}

          {analyticsLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          )}

          {analyticsError && !analyticsLoading && (
            <ErrorPanel status={analyticsErrorStatus} message={analyticsError} />
          )}

          {/* Main grid */}
          {analytics && !analyticsLoading && !analyticsError && (
            <div className="space-y-6">
              {/* Profile header */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <img
                  src={analytics.avatar}
                  alt={analytics.username}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate">
                    {analytics.name || analytics.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{analytics.username} ·{" "}
                    {(analytics.top_languages || []).slice(0, 3).join(" · ") || "no languages"}
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    OSS Score
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {analytics.open_source_score}
                  </p>
                </div>
              </motion.div>

              {/* Role + Sliders + Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: role + sliders */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-2xl border border-border bg-card p-5 space-y-5"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Target Role
                    </p>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-secondary/40 border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {roles.length === 0 && <option>Loading…</option>}
                      {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                      Simulated skills
                    </p>
                    <div className="space-y-3">
                      {simulatedSkills.map((s) => (
                        <div key={s.skill}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium">{s.skill}</span>
                            <span className="text-xs font-bold text-primary tabular-nums">{s.value}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={s.value}
                            onChange={(e) => handleSliderChange(s.skill, Number(e.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Right: radar */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Skill radar — current vs. target
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#71717A" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Current"
                        dataKey="current"
                        stroke="#7C3AED"
                        fill="#7C3AED"
                        fillOpacity={0.22}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="#06B6D4"
                        fill="#06B6D4"
                        fillOpacity={0.18}
                        strokeWidth={2}
                        strokeDasharray="4 3"
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Milestones */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold font-heading text-lg flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Transition milestones
                    </h2>
                    {careerPath?.timeline && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Estimated timeline: <span className="text-foreground">{careerPath.timeline}</span>
                      </p>
                    )}
                  </div>
                  {careerLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>

                {careerError && <p className="text-xs text-red-400">{careerError}</p>}

                {careerPath?.gap_analysis && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {careerPath.gap_analysis}
                  </p>
                )}

                {careerPath?.milestones && careerPath.milestones.length > 0 ? (
                  <ul className="space-y-2">
                    {careerPath.milestones.map((m, i) => (
                      <MilestoneRow
                        key={`${m.title}-${i}`}
                        milestone={m}
                        done={completed.has(m.title)}
                        onToggle={() => toggleMilestone(m.title)}
                      />
                    ))}
                  </ul>
                ) : (
                  !careerLoading && (
                    <p className="text-xs text-muted-foreground/60">No milestones yet.</p>
                  )
                )}
              </motion.div>

              {/* Project matches */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold font-heading text-lg flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-primary" />
                    Matching open-source issues
                  </h2>
                  {matchesLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>

                {matchesError && <p className="text-xs text-red-400">{matchesError}</p>}

                {matches?.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {matches.summary}
                  </p>
                )}

                {matches?.matches && matches.matches.length > 0 ? (
                  <ul className="space-y-2.5">
                    {matches.matches.map((m, i) => (
                      <li
                        key={`${m.issue_url}-${i}`}
                        className="p-3 rounded-xl bg-secondary/30 border border-border/60 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {m.repo}
                              {m.language && (
                                <span className="ml-2 text-foreground/70">· {m.language}</span>
                              )}
                            </p>
                            <a
                              href={m.issue_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:text-primary inline-flex items-center gap-1"
                            >
                              #{m.issue_number} {m.issue_title}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                            {m.reason && (
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                {m.reason}
                              </p>
                            )}
                            {m.labels && m.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {m.labels.slice(0, 4).map((l) => (
                                  <Badge
                                    key={l}
                                    variant="secondary"
                                    className="text-[9px] px-1.5 py-0"
                                  >
                                    {l}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-xs font-bold text-primary">
                              {Math.round(m.match_score * 100) / 100}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                              match
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !matchesLoading && (
                    <p className="text-xs text-muted-foreground/60">No matches yet — try adjusting your sliders.</p>
                  )
                )}
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function MilestoneRow({
  milestone,
  done,
  onToggle,
}: {
  milestone: CareerMilestone
  done: boolean
  onToggle: () => void
}) {
  const priorityColor =
    milestone.priority === "high"
      ? "text-red-400 bg-red-500/10 border-red-500/20"
      : milestone.priority === "medium"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"

  return (
    <li className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
      <button
        onClick={onToggle}
        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
            {milestone.title}
          </p>
          <span
            className={cn(
              "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md border font-medium",
              priorityColor
            )}
          >
            {milestone.priority}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{milestone.description}</p>
        {milestone.suggested_repos && milestone.suggested_repos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {milestone.suggested_repos.map((repo) => (
              <a
                key={repo}
                href={`https://github.com/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-2 py-0.5 rounded-md bg-foreground/5 hover:bg-primary/10 text-foreground/70 hover:text-primary border border-border transition-colors"
              >
                {repo}
              </a>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

function ErrorPanel({ status, message }: { status: number | null; message: string }) {
  const isRateLimit = status === 429
  const isNotFound = status === 404
  const heading = isRateLimit
    ? "GitHub rate limit reached"
    : isNotFound
    ? "User not found"
    : "Something went wrong"
  const accent = isRateLimit ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center max-w-md mx-auto">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3", accent)}>
        <AlertCircle className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold font-heading mb-1">{heading}</h2>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}
