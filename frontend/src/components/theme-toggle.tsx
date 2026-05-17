"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="w-9 h-9" />

  return (
    <Button
      id="theme-toggle-btn"
      variant="ghost"
      size="icon"
      className="rounded-full w-9 h-9 transition-all hover:bg-primary/10 hover:text-primary"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-[1.1rem] w-[1.1rem] transition-all" />
      ) : (
        <Moon className="h-[1.1rem] w-[1.1rem] transition-all" />
      )}
    </Button>
  )
}
