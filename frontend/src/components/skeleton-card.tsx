"use client"

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-secondary skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded-full bg-secondary skeleton-shimmer" />
          <div className="h-3 w-20 rounded-full bg-secondary skeleton-shimmer" />
        </div>
        <div className="h-8 w-10 rounded-lg bg-secondary skeleton-shimmer" />
      </div>
      {/* Bio */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-secondary skeleton-shimmer" />
        <div className="h-3 w-4/5 rounded-full bg-secondary skeleton-shimmer" />
      </div>
      {/* Tags */}
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-secondary skeleton-shimmer" />
        <div className="h-5 w-20 rounded-full bg-secondary skeleton-shimmer" />
      </div>
      {/* Stats */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-4">
          <div className="h-3 w-10 rounded-full bg-secondary skeleton-shimmer" />
          <div className="h-3 w-10 rounded-full bg-secondary skeleton-shimmer" />
          <div className="h-3 w-10 rounded-full bg-secondary skeleton-shimmer" />
        </div>
        <div className="h-7 w-20 rounded-lg bg-secondary skeleton-shimmer" />
      </div>
    </div>
  )
}
