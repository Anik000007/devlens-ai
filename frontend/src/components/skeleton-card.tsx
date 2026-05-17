"use client"

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-secondary" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-secondary rounded w-1/2" />
          <div className="h-3 bg-secondary rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-secondary rounded w-full" />
      <div className="h-3 bg-secondary rounded w-4/5" />
      <div className="flex gap-2">
        <div className="h-5 bg-secondary rounded-full w-16" />
        <div className="h-5 bg-secondary rounded-full w-20" />
        <div className="h-5 bg-secondary rounded-full w-14" />
      </div>
      <div className="h-8 bg-secondary rounded w-full" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border animate-pulse">
      <div className="w-8 h-8 rounded-full bg-secondary" />
      <div className="space-y-1.5 flex-1">
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="h-3 bg-secondary rounded w-1/2" />
      </div>
      <div className="h-4 bg-secondary rounded w-16" />
    </div>
  )
}
