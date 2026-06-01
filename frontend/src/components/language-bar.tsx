"use client"

interface LanguageBarProps {
  languages: { name: string; percentage: number; color: string }[]
  compact?: boolean
}

export function LanguageBar({ languages, compact }: LanguageBarProps) {
  const total = languages.reduce((sum, l) => sum + l.percentage, 0)
  
  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary/50 gap-px">
        {languages.slice(0, 6).map((lang) => (
          <div
            key={lang.name}
            className="h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(lang.percentage / total) * 100}%`,
              backgroundColor: lang.color || "#7C3AED",
              minWidth: "4px",
            }}
            title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
          />
        ))}
      </div>
      
      {/* Labels */}
      {!compact && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {languages.slice(0, 6).map((lang) => (
            <div key={lang.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: lang.color || "#7C3AED" }}
              />
              <span>{lang.name}</span>
              <span className="text-muted-foreground/60">{lang.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
