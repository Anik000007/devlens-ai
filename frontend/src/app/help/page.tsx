"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { HelpCircle, Search, BookOpen, MessageCircle, ExternalLink, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

const FAQS = [
  { q: "How do I analyze a GitHub profile?", a: "Go to the Dashboard, enter a GitHub username in the search bar, and click 'Analyze'. You'll see their stats, languages, commit history, and AI-generated insights." },
  { q: "How does the AI summary work?", a: "DevLens uses Google Gemini to analyze profile data, repos, and contribution patterns. It generates a role prediction, strengths summary, and skill radar automatically." },
  { q: "Can I compare two developers?", a: "Yes! Navigate to the Compare page and enter two GitHub usernames. You'll see side-by-side metrics, skill overlays, and an AI comparison analysis." },
  { q: "Where does the data come from?", a: "All data is fetched live from the GitHub REST API. No data is stored — we cache responses in Redis for performance." },
  { q: "Is there a way to export my results?", a: "On the Compare page, you can copy a shareable link. PDF export is coming soon." },
  { q: "What does the OSS score mean?", a: "The Open Source Score (0-100) is calculated from follower count, star count, repo diversity, and contribution consistency." },
]

const RESOURCES = [
  { icon: BookOpen, label: "Documentation", desc: "Learn how to use DevLens AI effectively" },
  { icon: MessageCircle, label: "Community", desc: "Join our community discussions" },
  { icon: ExternalLink, label: "GitHub", desc: "Star us on GitHub and contribute" },
]

export default function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState("")
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filtered = FAQS.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
        <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">Help & FAQs</h1>
            </div>
            <p className="text-sm text-muted-foreground">Find answers to common questions and resources</p>
          </motion.div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search frequently asked questions..."
              className="pl-9 h-11 bg-card border-border/60 focus-visible:ring-primary rounded-xl" />
          </div>

          {/* FAQs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden mb-6">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No results found for &quot;{search}&quot;
              </div>
            ) : filtered.map((faq, i) => (
              <button key={i} onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full text-left p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{faq.q}</span>
                  <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2", openIndex === i && "rotate-90")} />
                </div>
                {openIndex === i && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {faq.a}
                  </motion.p>
                )}
              </button>
            ))}
          </motion.div>

          {/* Resources */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {RESOURCES.map(({ icon: Icon, label, desc }) => (
              <div key={label}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer">
                <Icon className="w-5 h-5 text-primary mb-3" />
                <p className="text-sm font-medium mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
