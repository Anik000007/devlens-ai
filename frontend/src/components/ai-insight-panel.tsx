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
      <div className="rounded-2xl border border-primary/15 bg-card p-6 space-y-3 overflow-hidden">
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Generating AI Insights...</span>
        </div>
        <div className="space-y-2.5">
          {[100, 85, 90, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full skeleton-shimmer"
              style={{ width: `${w}%`, background: "var(--secondary)" }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/15 bg-card overflow-hidden group"
      style={{ boxShadow: "0 0 40px rgba(124,58,237,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border/60 bg-gradient-to-r from-primary/8 via-primary/3 to-transparent">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-primary font-heading">AI Developer Insights</span>
        {role && (
          <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/15">
            {role}
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="p-5 space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>

        {strengths.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Key Strengths</p>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s) => (
                <span
                  key={s}
                  className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/8 text-primary border border-primary/12 font-medium transition-colors hover:border-primary/25"
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
