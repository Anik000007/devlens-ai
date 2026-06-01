"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { MiniChart } from "@/components/mini-chart"
import { LANG_COLORS } from "@/lib/mock-data"
import { Users, GitFork, Star, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeveloperCardProps {
  developer: {
    id: string
    username: string
    name: string
    avatar: string
    bio: string
    location?: string
    followers: number
    repos: number
    stars: number
    topLanguages: string[]
    aiTags?: string[]
    score: number
    contributions: number[]
  }
  index?: number
  compact?: boolean
}

export function DeveloperCard({ developer: d, index = 0, compact }: DeveloperCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/profile/${d.username}`} className="block h-full group">
        <div className={cn(
          "h-full rounded-2xl border border-border bg-card p-5 space-y-4",
          "transition-all duration-300 ease-out",
          "hover:border-primary/20 hover:shadow-[0_8px_40px_rgba(124,58,237,0.08)]",
          "hover:-translate-y-1 cursor-pointer relative overflow-hidden"
        )}>
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-start gap-3">
            <div className="relative shrink-0">
              <img
                src={d.avatar}
                alt={d.name}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full ring-2 ring-border object-cover group-hover:ring-primary/30 transition-all duration-300"
              />
              {/* Score badge */}
              <span className="absolute -bottom-1 -right-1 text-[10px] font-bold w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center leading-none shadow-md">
                {d.score > 95 ? "★" : d.score > 85 ? "◆" : "●"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors duration-200">{d.name}</p>
              <p className="text-xs text-muted-foreground">@{d.username}</p>
              {d.location && (
                <p className="text-xs text-muted-foreground/50 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {d.location}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="text-lg font-bold gradient-text font-heading">{d.score}</div>
              <div className="text-[10px] text-muted-foreground">Score</div>
            </div>
          </div>

          {/* Bio */}
          {!compact && (
            <p className="relative text-xs text-muted-foreground leading-relaxed line-clamp-2">{d.bio}</p>
          )}

          {/* AI Tags */}
          <div className="relative flex flex-wrap gap-1.5">
            {(d.aiTags || []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/12 font-medium"
              >
                {tag}
              </span>
            ))}
            {(d.aiTags || []).length > 2 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                +{(d.aiTags || []).length - 2}
              </span>
            )}
          </div>

          {/* Languages */}
          <div className="relative flex gap-2 flex-wrap">
            {d.topLanguages.slice(0, 4).map((lang) => (
              <div key={lang} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: LANG_COLORS[lang] || "#7C3AED" }}
                />
                {lang}
              </div>
            ))}
          </div>

          {/* Stats + mini chart */}
          <div className="relative flex items-end justify-between">
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Users className="w-3 h-3" />
                {d.followers >= 1000 ? `${(d.followers / 1000).toFixed(0)}k` : d.followers}
              </span>
              <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                <GitFork className="w-3 h-3" />
                {d.repos}
              </span>
              <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Star className="w-3 h-3" />
                {d.stars >= 1000 ? `${(d.stars / 1000).toFixed(0)}k` : d.stars}
              </span>
            </div>
            <MiniChart data={d.contributions} color="#7C3AED" width={80} height={28} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
