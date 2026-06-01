"use client"

interface MiniChartProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function MiniChart({ data, color = "#7C3AED", width = 80, height = 28 }: MiniChartProps) {
  if (!data || data.length < 2) return null
  
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (v / max) * height * 0.85
    return `${x},${y}`
  })
  
  const linePath = `M${points.join(" L")}`
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const gradientId = `mini-chart-gradient-${color.replace("#", "")}`
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
