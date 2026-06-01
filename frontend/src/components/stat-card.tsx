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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative p-5 rounded-2xl border bg-card overflow-hidden group",
        "transition-all duration-300 ease-out",
        accent
          ? "border-primary/20 hover:border-primary/40"
          : "border-border hover:border-primary/15",
        accent && "shadow-[0_0_30px_rgba(124,58,237,0.08)]"
      )}
    >
      {/* Ambient gradient on accent cards */}
      {accent && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5 pointer-events-none" />
      )}

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors duration-300",
          accent
            ? "bg-primary/15 text-primary group-hover:bg-primary/20"
            : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
        )}>
          {icon}
        </div>
        {trendValue && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            trend === "up" ? "bg-emerald-500/12 text-emerald-400" :
            trend === "down" ? "bg-red-500/12 text-red-400" :
            "bg-secondary text-muted-foreground"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"} {trendValue}
          </span>
        )}
      </div>
      <p className="relative text-2xl font-bold tracking-tight font-heading">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="relative text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="relative text-xs text-muted-foreground/50 mt-0.5">{sub}</p>}
    </motion.div>
  )
}
