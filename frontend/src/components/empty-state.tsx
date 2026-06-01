"use client"
import { ReactNode } from "react"
import { motion } from "framer-motion"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-border bg-card/50"
    >
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 animate-float">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-1.5 font-heading">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  )
}
