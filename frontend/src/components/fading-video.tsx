"use client"
import React, { useRef, useEffect } from "react"

interface FadingVideoProps {
  src: string
  className?: string
  style?: React.CSSProperties
}

export function FadingVideo({ src, className, style }: FadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const fadingOutRef = useRef<boolean>(false)

  const fadeTo = (targetOpacity: number, duration: number) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const video = videoRef.current
    if (!video) return

    const startOpacity = parseFloat(video.style.opacity) || 0
    const startTime = performance.now()

    const animate = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = startOpacity + (targetOpacity - startOpacity) * progress
      video.style.opacity = current.toString()

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set initial opacity to 0
    video.style.opacity = "0"

    const handleLoadedData = () => {
      video.style.opacity = "0"
      video.play().catch(() => {})
      fadeTo(1, 500)
    }

    const handleTimeUpdate = () => {
      const duration = video.duration
      const currentTime = video.currentTime
      if (!duration || isNaN(duration)) return

      // Time left until video ends
      const timeLeft = duration - currentTime

      if (!fadingOutRef.current && timeLeft <= 0.55 && timeLeft > 0) {
        fadingOutRef.current = true
        fadeTo(0, 500)
      }
    }

    const handleEnded = () => {
      video.style.opacity = "0"
      setTimeout(() => {
        if (!videoRef.current) return
        const v = videoRef.current
        v.currentTime = 0
        v.play().catch(() => {})
        fadingOutRef.current = false
        fadeTo(1, 500)
      }, 100)
    }

    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    // Trigger load in case video was already loaded
    video.load()

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={{ ...style, opacity: 0 }}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  )
}
