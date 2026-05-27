"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Compass, GitCompare, Star,
  ChevronLeft, ChevronRight, X, Settings, HelpCircle,
} from "lucide-react"

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/compare", icon: GitCompare, label: "Compare" },
  { href: "/", icon: Star, label: "Home" },
]

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: open ? 220 : 64 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 z-40 h-full shrink-0 border-r border-border",
          "bg-sidebar flex flex-col overflow-hidden",
          "hidden lg:flex"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 glow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7l9 5 9-5-9-5z" fill="white" />
              <path d="M3 17l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 12l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="ml-2.5 whitespace-nowrap"
              >
                <span className="font-bold text-sm gradient-text">DevLens AI</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-sm whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="pb-4 px-2 space-y-1 border-t border-sidebar-border pt-3">
          {[{ Icon: Settings, label: "Settings", href: "/settings" }, { Icon: HelpCircle, label: "Help", href: "/help" }].map(({ Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all",
                pathname === href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </div>
      </motion.aside>

      {/* Toggle button — outside sidebar to avoid overflow-hidden clipping */}
      <motion.button
        onClick={onToggle}
        animate={{ left: open ? 217 : 61 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed top-20 z-50 w-6 h-6 rounded-full bg-card border border-border hidden lg:flex items-center justify-center shadow-md hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
      >
        {open ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </motion.button>

      {/* Mobile sidebar (slide-in) */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed left-0 top-0 z-40 h-full w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col lg:hidden"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7l9 5 9-5-9-5z" fill="white" />
                    <path d="M3 17l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M3 12l9 5 9-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span
                  className="font-bold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #14B8A6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >DevLens AI</span>
              </div>
              <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-2">
              {NAV.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onToggle}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
              <div className="pt-3 mt-3 border-t border-sidebar-border">
                {[{ Icon: Settings, label: "Settings", href: "/settings" }, { Icon: HelpCircle, label: "Help", href: "/help" }].map(({ Icon, label, href }) => (
                  <Link key={label} href={href} onClick={onToggle}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all">
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
