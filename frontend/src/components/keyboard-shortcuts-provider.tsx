"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Keyboard } from "lucide-react"

export interface ShortcutBinding {
  keys: string[]
  label: string
  group: "navigation" | "actions"
}

export const SHORTCUTS: ShortcutBinding[] = [
  { keys: ["⌘", "K"], label: "Focus search / Explore", group: "actions" },
  { keys: ["?"], label: "Show shortcut help", group: "actions" },
  { keys: ["G", "H"], label: "Go to Home", group: "navigation" },
  { keys: ["G", "D"], label: "Go to Dashboard", group: "navigation" },
  { keys: ["G", "E"], label: "Go to Explore", group: "navigation" },
  { keys: ["G", "C"], label: "Go to Compare", group: "navigation" },
  { keys: ["G", "P"], label: "Go to Pipeline", group: "navigation" },
  { keys: ["G", "R"], label: "Go to Career", group: "navigation" },
  { keys: ["G", "S"], label: "Go to Settings", group: "navigation" },
]

const CHORD_TIMEOUT_MS = 1500

function isEditableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  if (el.isContentEditable) return true
  return false
}

function focusSearchOrExplore(router: ReturnType<typeof useRouter>) {
  // Prefer focusing any visible search input on the page; fall back to /explore.
  const candidates = document.querySelectorAll<HTMLInputElement>(
    'input[type="search"], input[placeholder*="username" i], input[placeholder*="search" i]'
  )
  for (const el of Array.from(candidates)) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      el.focus()
      el.select()
      return
    }
  }
  router.push("/explore")
}

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [helpOpen, setHelpOpen] = useState(false)
  const chordRef = useRef<{ key: string; timer: ReturnType<typeof setTimeout> } | null>(null)

  useEffect(() => {
    const clearChord = () => {
      if (chordRef.current) {
        clearTimeout(chordRef.current.timer)
        chordRef.current = null
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K always works, even inside inputs (it focuses search itself).
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        focusSearchOrExplore(router)
        clearChord()
        return
      }

      // Block all other shortcuts while typing.
      if (isEditableTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // `?` opens help.
      if (e.key === "?") {
        e.preventDefault()
        setHelpOpen((v) => !v)
        clearChord()
        return
      }

      // `Esc` closes help.
      if (e.key === "Escape" && helpOpen) {
        e.preventDefault()
        setHelpOpen(false)
        return
      }

      const k = e.key.toLowerCase()

      // Start chord on `g`.
      if (k === "g" && !chordRef.current) {
        e.preventDefault()
        const timer = setTimeout(() => {
          chordRef.current = null
        }, CHORD_TIMEOUT_MS)
        chordRef.current = { key: "g", timer }
        return
      }

      // Resolve chord.
      if (chordRef.current?.key === "g") {
        const target: Record<string, string> = {
          h: "/",
          d: "/dashboard",
          e: "/explore",
          c: "/compare",
          p: "/pipeline",
          r: "/career",
          s: "/settings",
        }
        if (target[k]) {
          e.preventDefault()
          router.push(target[k])
        }
        clearChord()
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
      clearChord()
    }
  }, [router, helpOpen])

  return (
    <>
      {children}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-base font-heading">Keyboard shortcuts</h2>
                </div>
                <button
                  onClick={() => setHelpOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                <ShortcutList shortcuts={SHORTCUTS} />
              </div>
              <div className="px-5 py-3 border-t border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                Press <Kbd>Esc</Kbd> or click outside to close.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function ShortcutList({ shortcuts }: { shortcuts: ShortcutBinding[] }) {
  const groups = {
    actions: shortcuts.filter((s) => s.group === "actions"),
    navigation: shortcuts.filter((s) => s.group === "navigation"),
  }
  return (
    <div className="space-y-5">
      {(["actions", "navigation"] as const).map((g) => (
        <div key={g}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            {g === "actions" ? "Actions" : "Navigation"}
          </p>
          <ul className="space-y-1.5">
            {groups[g].map((s, i) => (
              <li
                key={`${g}-${i}`}
                className="flex items-center justify-between text-sm rounded-lg px-3 py-2 hover:bg-secondary/40"
              >
                <span>{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, ki) => (
                    <Kbd key={ki}>{k}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center min-w-[1.5rem] justify-center text-[10px] font-mono font-medium px-1.5 py-0.5 bg-foreground/5 border border-border rounded-md text-foreground">
      {children}
    </kbd>
  )
}
