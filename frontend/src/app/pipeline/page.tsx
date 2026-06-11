"use client"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, Users, Trash2, ExternalLink, ChevronLeft, ChevronRight,
  X, Loader2, Star, GitFork, Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  usePipelineStore,
  PIPELINE_STAGES,
  type PipelineStage,
  type PipelineCandidate,
} from "@/lib/pipeline-store"
import { searchUsers, type ExploreDeveloper } from "@/lib/api"

export default function PipelinePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const candidates = usePipelineStore((s) => s.candidates)
  const addCandidate = usePipelineStore((s) => s.addCandidate)
  const removeCandidate = usePipelineStore((s) => s.removeCandidate)
  const moveCandidate = usePipelineStore((s) => s.moveCandidate)
  const reorderInStage = usePipelineStore((s) => s.reorderInStage)
  const clearAll = usePipelineStore((s) => s.clearAll)

  // Filters
  const [filterText, setFilterText] = useState("")
  const [minStars, setMinStars] = useState(0)
  const [minScore, setMinScore] = useState(0)

  // Sourcing search
  const [sourceQuery, setSourceQuery] = useState("")
  const [sourceResults, setSourceResults] = useState<ExploreDeveloper[]>([])
  const [sourcing, setSourcing] = useState(false)
  const [sourceError, setSourceError] = useState("")

  // Debounced search
  useEffect(() => {
    if (!sourceQuery || sourceQuery.length < 2) {
      setSourceResults([])
      setSourceError("")
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        setSourcing(true)
        setSourceError("")
        const res = await searchUsers(sourceQuery.trim())
        if (!cancelled) setSourceResults(res.developers || [])
      } catch (err) {
        if (!cancelled) setSourceError(err instanceof Error ? err.message : "Search failed")
      } finally {
        if (!cancelled) setSourcing(false)
      }
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [sourceQuery])

  const usernamesInPipeline = useMemo(
    () => new Set(candidates.map((c) => c.username.toLowerCase())),
    [candidates]
  )

  const handleAddFromSource = (dev: ExploreDeveloper) => {
    addCandidate({
      id: dev.id || dev.username,
      username: dev.username,
      name: dev.name,
      avatar: dev.avatar,
      bio: dev.bio,
      topLanguages: dev.topLanguages,
      stars: dev.stars,
      followers: dev.followers,
      repos: dev.repos,
      score: dev.score,
    })
  }

  // Apply filters
  const filteredCandidates = useMemo(() => {
    const q = filterText.toLowerCase().trim()
    return candidates.filter((c) => {
      if (q && !`${c.name} ${c.username} ${c.bio}`.toLowerCase().includes(q)) return false
      if (c.stars < minStars) return false
      if (c.score < minScore) return false
      return true
    })
  }, [candidates, filterText, minStars, minScore])

  const byStage = useMemo(() => {
    const map: Record<PipelineStage, PipelineCandidate[]> = {
      sourced: [],
      review: [],
      interviewing: [],
      shortlisted: [],
    }
    for (const c of filteredCandidates) map[c.stage].push(c)
    return map
  }, [filteredCandidates])

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
            className="mb-6 flex items-start justify-between gap-4 flex-wrap"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold font-heading">Recruiter Pipeline</h1>
                <Badge className="bg-primary/10 text-primary border-primary/20 ml-1">
                  {candidates.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Source, track, and shortlist candidates. Data persists in your browser.
              </p>
            </div>
            {candidates.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm(`Clear all ${candidates.length} candidates?`)) clearAll()
                }}
                className="rounded-xl text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear all
              </Button>
            )}
          </motion.div>

          {/* Sourcing strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Source new candidates
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={sourceQuery}
                onChange={(e) => setSourceQuery(e.target.value)}
                placeholder="Search GitHub users to add..."
                className="pl-9 h-11 rounded-xl bg-secondary/40 border-border/60"
              />
              {sourceQuery && (
                <button
                  onClick={() => setSourceQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {sourcing && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
              </div>
            )}
            {sourceError && (
              <p className="mt-3 text-xs text-red-400">{sourceError}</p>
            )}
            {sourceResults.length > 0 && (
              <ul className="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
                {sourceResults.map((dev) => {
                  const already = usernamesInPipeline.has(dev.username.toLowerCase())
                  return (
                    <li
                      key={dev.id || dev.username}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/30 transition-colors"
                    >
                      <img
                        src={dev.avatar}
                        alt={dev.username}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {dev.name || dev.username}
                          <span className="text-muted-foreground text-xs ml-1.5">@{dev.username}</span>
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5" /> {dev.stars.toLocaleString()}
                          </span>
                          <span>{dev.topLanguages.slice(0, 2).join(", ") || "—"}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={already ? "ghost" : "outline"}
                        disabled={already}
                        onClick={() => handleAddFromSource(dev)}
                        className="rounded-lg text-xs"
                      >
                        {already ? "✓ Added" : "+ Add"}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 flex flex-wrap items-center gap-3"
          >
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter by name or bio..."
                className="pl-9 h-10 rounded-xl bg-card border-border/60"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="uppercase tracking-wider">Min ⭐</span>
              <input
                type="number"
                min={0}
                value={minStars}
                onChange={(e) => setMinStars(Number(e.target.value) || 0)}
                className="w-20 h-9 px-2 rounded-lg bg-card border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="uppercase tracking-wider">Min score</span>
              <input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value) || 0)}
                className="w-20 h-9 px-2 rounded-lg bg-card border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            {(filterText || minStars > 0 || minScore > 0) && (
              <button
                onClick={() => {
                  setFilterText("")
                  setMinStars(0)
                  setMinScore(0)
                }}
                className="text-xs text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
          </motion.div>

          {/* Kanban */}
          {candidates.length === 0 ? (
            <EmptyState
              icon={<Users className="w-7 h-7 text-muted-foreground" />}
              title="No candidates yet"
              description="Use the search above to find developers and bookmark them into your pipeline."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {PIPELINE_STAGES.map(({ id: stageId, label }, stageIdx) => {
                const items = byStage[stageId]
                return (
                  <motion.div
                    key={stageId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + stageIdx * 0.05 }}
                    className="rounded-2xl border border-border bg-card/40 p-3 flex flex-col min-h-[200px]"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {label}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {items.length}
                      </Badge>
                    </div>
                    {items.length === 0 ? (
                      <div className="text-xs text-muted-foreground/60 text-center py-6">
                        Empty
                      </div>
                    ) : (
                      <Reorder.Group
                        axis="y"
                        values={items.map((c) => c.id)}
                        onReorder={(ids) => reorderInStage(stageId, ids as string[])}
                        className="space-y-2 flex-1"
                      >
                        <AnimatePresence>
                          {items.map((c) => (
                            <Reorder.Item
                              key={c.id}
                              value={c.id}
                              className="rounded-xl bg-card border border-border p-3 cursor-grab active:cursor-grabbing shadow-sm"
                            >
                              <PipelineCard
                                candidate={c}
                                stage={stageId}
                                onMove={moveCandidate}
                                onRemove={removeCandidate}
                              />
                            </Reorder.Item>
                          ))}
                        </AnimatePresence>
                      </Reorder.Group>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function PipelineCard({
  candidate,
  stage,
  onMove,
  onRemove,
}: {
  candidate: PipelineCandidate
  stage: PipelineStage
  onMove: (id: string, stage: PipelineStage) => void
  onRemove: (id: string) => void
}) {
  const stageIdx = PIPELINE_STAGES.findIndex((s) => s.id === stage)
  const prev = PIPELINE_STAGES[stageIdx - 1]
  const next = PIPELINE_STAGES[stageIdx + 1]

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        <img
          src={candidate.avatar}
          alt={candidate.username}
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{candidate.name || candidate.username}</p>
          <p className="text-[11px] text-muted-foreground truncate">@{candidate.username}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {candidate.topLanguages.slice(0, 2).map((lang) => (
          <Badge key={lang} variant="secondary" className="text-[9px] px-1.5 py-0">
            {lang}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5" /> {candidate.stars.toLocaleString()}
        </span>
        <span className="flex items-center gap-0.5">
          <GitFork className="w-2.5 h-2.5" /> {candidate.repos}
        </span>
        <span className="font-semibold text-primary">{candidate.score}/100</span>
      </div>
      <div className="flex items-center justify-between gap-1 pt-2 border-t border-border/60">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => prev && onMove(candidate.id, prev.id)}
            disabled={!prev}
            className="p-1 rounded hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
            aria-label="Move to previous stage"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => next && onMove(candidate.id, next.id)}
            disabled={!next}
            className="p-1 rounded hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
            aria-label="Move to next stage"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <Link
            href={`/profile/${candidate.username}`}
            className="p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-primary"
            aria-label="Open profile"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => onRemove(candidate.id)}
            className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
            aria-label="Remove candidate"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
