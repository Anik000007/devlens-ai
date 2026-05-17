"use client"
import { useMemo } from "react"

interface MiniChartProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function MiniChart({ data, color = "#6366F1", width = 120, height = 36 }: MiniChartProps) {
  const points = useMemo(() => {
    if (!data.length) return ""
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const step = width / (data.length - 1)
    return data
      .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
      .join(" ")
  }, [data, width, height])

  const areaPoints = useMemo(() => {
    if (!data.length) return ""
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const step = width / (data.length - 1)
    const linePoints = data
      .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    return `${linePoints.join(" ")} ${width},${height} 0,${height}`
  }, [data, width, height])

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`mini-grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#mini-grad-${color.replace("#","")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
