"use client"
import { LANG_COLORS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface LanguageBarProps {
  languages: { name: string; percentage: number; color?: string }[]
  showLabels?: boolean
  compact?: boolean
}

export function LanguageBar({ languages, showLabels = true, compact = false }: LanguageBarProps) {
  return (
    <div className="w-full space-y-2">
      {/* Bar */}
      <div className={cn("flex rounded-full overflow-hidden gap-0.5", compact ? "h-1.5" : "h-2.5")}>
        {languages.map((lang) => (
          <div
            key={lang.name}
            className="transition-all duration-500"
            style={{
              width: `${lang.percentage}%`,
              backgroundColor: lang.color || LANG_COLORS[lang.name] || "#8b5cf6",
            }}
            title={`${lang.name}: ${lang.percentage}%`}
          />
        ))}
      </div>
      {/* Labels */}
      {showLabels && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {languages.map((lang) => (
            <div key={lang.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: lang.color || LANG_COLORS[lang.name] || "#8b5cf6" }}
              />
              {lang.name}
              <span className="text-muted-foreground/60">{lang.percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
