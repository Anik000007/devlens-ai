"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Sun, Moon, Palette, Globe, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "lg:pl-[220px]" : "lg:pl-16")}>
        <Navbar showSidebarToggle onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground">Customize your DevLens AI experience</p>
          </motion.div>

          <div className="space-y-6">
            {/* Appearance */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold flex items-center gap-2 mb-4"><Palette className="w-4 h-4 text-primary" /> Appearance</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Theme</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "light", label: "Light", icon: Sun },
                    ].map(({ value, label, icon: Icon }) => (
                      <button key={value} onClick={() => setTheme(value)}
                        className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all",
                          theme === value
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                        )}>
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* API Configuration */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold flex items-center gap-2 mb-4"><Globe className="w-4 h-4 text-primary" /> API</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Backend URL</p>
                  <Input defaultValue={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} className="bg-secondary border-border rounded-xl text-sm" readOnly />
                  <p className="text-xs text-muted-foreground mt-1">Set via <code className="text-primary">NEXT_PUBLIC_API_URL</code> in <code className="text-primary">.env.local</code></p>
                </div>
              </div>
            </motion.div>

            {/* Coming soon */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border/60 bg-card/50 p-6">
              <h2 className="font-semibold text-muted-foreground flex items-center gap-2 mb-3">More Settings <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">Coming Soon</span></h2>
              <div className="space-y-2">
                {["Notifications", "Privacy", "Integrations", "Keyboard Shortcuts"].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
                    <span>{item}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
