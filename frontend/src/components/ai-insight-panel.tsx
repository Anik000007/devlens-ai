"use client"
import { motion } from "framer-motion"
import { Sparkles, Loader2 } from "lucide-react"

interface AIInsightPanelProps {
  summary: string
  strengths?: string[]
  role?: string
  loading?: boolean
}

export function AIInsightPanel({ summary, strengths = [], role, loading }: AIInsightPanelProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Generating AI Insights...</span>
        </div>
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-secondary rounded w-full" />
          <div className="h-3 bg-secondary rounded w-5/6" />
          <div className="h-3 bg-secondary rounded w-4/5" />
          <div className="h-3 bg-secondary rounded w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-card overflow-hidden"
      style={{ boxShadow: "0 0 30px rgba(99,102,241,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-linear-to-r from-primary/10 to-transparent">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-primary">AI Developer Insights</span>
        {role && (
          <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium border border-primary/20">
            {role}
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="p-5 space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>

        {strengths.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Strengths</p>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
