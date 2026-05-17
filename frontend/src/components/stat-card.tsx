"use client"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  sub?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  accent?: boolean
  delay?: number
}

export function StatCard({ icon, label, value, sub, trend, trendValue, accent, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative p-5 rounded-2xl border bg-card card-hover overflow-hidden",
        accent ? "border-primary/30 glow-sm" : "border-border"
      )}
    >
      {accent && (
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent pointer-events-none" />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg",
          accent ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
        )}>
          {icon}
        </div>
        {trendValue && (
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
            trend === "up" ? "bg-emerald-500/15 text-emerald-400" :
            trend === "down" ? "bg-red-500/15 text-red-400" :
            "bg-secondary text-muted-foreground"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"} {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </motion.div>
  )
}
