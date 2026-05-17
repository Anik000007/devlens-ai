"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, Search, GitBranch, Bell, X } from "lucide-react"

interface NavbarProps {
  onMenuToggle?: () => void
  showSidebarToggle?: boolean
}

export function Navbar({ onMenuToggle, showSidebarToggle }: NavbarProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/profile/${search.trim()}`)
      setSearch("")
      setSearchOpen(false)
    }
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 flex items-center">
      <div className="w-full h-full flex items-center px-4 sm:px-6 glass border-b border-border bg-background/80">
        {/* Left: menu toggle + logo */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              id="sidebar-toggle-btn"
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-secondary transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link href="/" id="navbar-logo" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center glow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7l9 5 9-5-9-5z" fill="white" />
                <path d="M3 17l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 12l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight gradient-text hidden sm:block">DevLens AI</span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 hidden md:flex">BETA</Badge>
          </Link>
        </div>

        {/* Center: search (desktop) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="navbar-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GitHub username..."
              className="pl-9 h-9 text-sm bg-secondary border-border/50 focus-visible:ring-primary rounded-xl w-full"
            />
          </div>
        </form>

        {/* Right: actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Mobile search toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary"
          >
            <GitBranch className="w-4 h-4" />
          </a>

          <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>

          <ThemeToggle />

          <Button
            id="navbar-analyze-btn"
            size="sm"
            className="ml-1 rounded-xl text-xs font-semibold glow hidden sm:flex"
          >
            <Link href="/explore">Explore →</Link>
          </Button>
        </div>
      </div>

      {/* Mobile search bar drop-down */}
      {searchOpen && (
        <div className="absolute top-16 left-0 right-0 px-4 py-3 bg-background border-b border-border md:hidden">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enter GitHub username..."
                className="pl-9 h-9 text-sm bg-secondary border-border/50 rounded-xl w-full"
              />
            </div>
            <Button type="submit" size="sm" className="rounded-xl">Search</Button>
          </form>
        </div>
      )}
    </header>
  )
}
