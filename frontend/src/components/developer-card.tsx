"use client"
import Link from "next/link"
import Image from "next/image"
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
    >
      <Link href={`/profile/${d.username}`} className="block h-full">
        <div className={cn(
          "h-full rounded-2xl border border-border bg-card p-5 space-y-4 transition-all duration-200",
          "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
        )}>
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <img
                src={d.avatar}
                alt={d.name}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full ring-2 ring-border object-cover"
              />
              {/* Score badge */}
              <span className="absolute -bottom-1 -right-1 text-[10px] font-bold w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center leading-none">
                {d.score > 95 ? "★" : d.score > 85 ? "◆" : "●"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{d.name}</p>
              <p className="text-xs text-muted-foreground">@{d.username}</p>
              {d.location && (
                <p className="text-xs text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {d.location}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="text-lg font-bold gradient-text">{d.score}</div>
              <div className="text-[10px] text-muted-foreground">Score</div>
            </div>
          </div>

          {/* Bio */}
          {!compact && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{d.bio}</p>
          )}

          {/* AI Tags */}
          <div className="flex flex-wrap gap-1.5">
            {(d.aiTags || []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
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
          <div className="flex gap-1.5 flex-wrap">
            {d.topLanguages.slice(0, 4).map((lang) => (
              <div key={lang} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: LANG_COLORS[lang] || "#8b5cf6" }}
                />
                {lang}
              </div>
            ))}
          </div>

          {/* Stats + mini chart */}
          <div className="flex items-end justify-between">
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {d.followers >= 1000 ? `${(d.followers / 1000).toFixed(0)}k` : d.followers}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                {d.repos}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {d.stars >= 1000 ? `${(d.stars / 1000).toFixed(0)}k` : d.stars}
              </span>
            </div>
            <MiniChart data={d.contributions} color="#6366F1" width={80} height={28} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
