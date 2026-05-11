"use client"

import { ThemeId, weatherThemes } from "@/lib/weather-types"
import { Cloud, Waves } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

function SolarPanelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="1" />
      <line x1="9"  y1="5"  x2="9"  y2="19" />
      <line x1="15" y1="5"  x2="15" y2="19" />
      <line x1="2"  y1="12" x2="22" y2="12" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9"  y1="22" x2="15" y2="22" />
    </svg>
  )
}

const THEME_ICONS: Record<ThemeId, React.ReactNode> = {
  weather:    <Cloud className="h-5 w-5" />,
  renewables: <SolarPanelIcon className="h-5 w-5" />,
  maritime:   <Waves className="h-5 w-5" />,
}

interface ThemeSelectorProps {
  activeTheme: ThemeId
  onThemeChange: (theme: ThemeId) => void
  compact?: boolean
}

export function ThemeSelector({ activeTheme, onThemeChange, compact = true }: ThemeSelectorProps) {
  return (
    <div className="fixed right-4 top-20 z-50 flex flex-col gap-2">
      {weatherThemes.map((theme) => {
        const isActive = activeTheme === theme.id
        const baseClass = `
          flex items-center justify-center gap-2
          border shadow-md transition-all duration-200
          ${compact
            ? "w-10 h-10 rounded-full"
            : "h-10 px-3 rounded-lg"
          }
          ${isActive
            ? "bg-primary text-primary-foreground border-primary scale-105"
            : "bg-card/90 text-muted-foreground border-border hover:bg-accent hover:text-foreground backdrop-blur-sm"
          }
        `

        if (compact) {
          return (
            <Tooltip key={theme.id}>
              <TooltipTrigger asChild>
                <button onClick={() => onThemeChange(theme.id)} className={baseClass}>
                  {THEME_ICONS[theme.id]}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">{theme.name}</TooltipContent>
            </Tooltip>
          )
        }

        return (
          <button key={theme.id} onClick={() => onThemeChange(theme.id)} className={baseClass}>
            {THEME_ICONS[theme.id]}
            <span className="text-sm font-medium whitespace-nowrap">{theme.name}</span>
          </button>
        )
      })}
    </div>
  )
}
