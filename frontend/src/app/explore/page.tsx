"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { DeveloperCard } from "@/components/developer-card"
import { SkeletonCard } from "@/components/skeleton-card"
import { EmptyState } from "@/components/empty-state"
import { fetchTrending, searchUsers, type ExploreDeveloper } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, TrendingUp, Users, X, ChevronDown, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const LANGUAGES = ["All", "JavaScript", "TypeScript", "Python", "Rust", "Go", "C", "C++", "Java"]
const SORT_OPTIONS = [
  { value: "score", label: "AI Score" },
  { value: "followers", label: "Followers" },
  { value: "stars", label: "Stars" },
  { value: "repos", label: "Repos" },
]

export default function ExplorePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  
  // Data states
  const [trendingDevs, setTrendingDevs] = useState<ExploreDeveloper[]>([])
  const [searchResults, setSearchResults] = useState<ExploreDeveloper[]>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  
  // Filter states
  const [selectedLang, setSelectedLang] = useState("All")
  const [sortBy, setSortBy] = useState("score")
  const [filterOpen, setFilterOpen] = useState(false)

  // Load trending on mount
  useEffect(() => {
    let cancelled = false
    async function loadTrending() {
      try {
        setLoading(true)
        const res = await fetchTrending()
        if (!cancelled) {
          setTrendingDevs(res.developers || [])
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load trending developers")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadTrending()
    return () => { cancelled = true }
  }, [])

  // Handle search when query changes
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    const delay = setTimeout(async () => {
      try {
        setIsSearching(true)
        const res = await searchUsers(search)
        if (!cancelled) {
          setSearchResults(res.developers || [])
        }
      } catch (err) {
        // ignore search errors
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }, 600) // Debounce

    return () => {
      cancelled = true
      clearTimeout(delay)
    }
  }, [search])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  // Determine which list to show and apply filters
  const baseList = search && search.length >= 2 ? searchResults : trendingDevs
  const isSearchActive = search && search.length >= 2

  let filtered = [...baseList]
  if (selectedLang !== "All") {
    filtered = filtered.filter(d => d.topLanguages.some(l => l.toLowerCase() === selectedLang.toLowerCase()))
  }
  
  filtered.sort((a, b) => {
    if (sortBy === "followers") return b.followers - a.followers
    if (sortBy === "stars") return b.stars - a.stars
    if (sortBy === "repos") return b.repos - a.repos
    return b.score - a.score
  })

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
        <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">{isSearchActive ? 'Search Results' : 'Explore Developers'}</h1>
              {!loading && !isSearching && (
                <Badge className="bg-primary/10 text-primary border-primary/20 ml-1">{filtered.length}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isSearchActive ? `Searching GitHub for "${search}"` : 'Discover trending open-source contributors worldwide'}
            </p>
          </motion.div>

          {/* Search + Filter Bar */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-6 space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    if (e.target.value === "") setSearch("")
                  }}
                  placeholder="Search GitHub users..."
                  className="pl-9 h-11 bg-card border-border/60 focus-visible:ring-primary rounded-xl"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(""); setSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className={cn("h-11 px-4 rounded-xl border-border/60 flex items-center gap-2", filterOpen && "border-primary/40 bg-primary/5")}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", filterOpen && "rotate-180")} />
              </Button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-3 rounded-xl bg-card border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hidden sm:block"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </form>

            {/* Filter pills */}
            <AnimatePresence>
              {filterOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="sm:hidden mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sort By</p>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-10 w-full px-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {SORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Programming Language</p>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setSelectedLang(lang)}
                            className={cn("px-3 py-1 rounded-xl text-xs font-medium transition-all",
                              selectedLang === lang
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filters */}
            {(selectedLang !== "All" || search) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {selectedLang !== "All" && (
                  <button onClick={() => setSelectedLang("All")}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {selectedLang} <X className="w-3 h-3" />
                  </button>
                )}
                {search && (
                  <button onClick={() => { setSearch(""); setSearchInput("") }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                    "{search}" <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Developer Grid */}
          {error ? (
             <div className="p-8 text-center border border-red-500/20 bg-red-500/10 rounded-2xl max-w-lg mx-auto mt-12">
               <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
               <p className="text-red-400 font-medium">Error loading developers: {error}</p>
             </div>
          ) : (loading && !search) || isSearching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="w-7 h-7 text-muted-foreground" />}
              title={isSearchActive ? "No developers found" : "No results for filter"}
              description={`We couldn't find any developers matching your criteria. Try adjusting your filters.`}
              action={
                <Button variant="outline" onClick={() => { setSearch(""); setSearchInput(""); setSelectedLang("All") }} className="rounded-xl">
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              <AnimatePresence>
                {filtered.map((dev, i) => (
                  <DeveloperCard key={dev.id} developer={dev} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}
