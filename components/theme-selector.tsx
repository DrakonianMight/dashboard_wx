"use client"

import { ThemeId, weatherThemes } from "@/lib/weather-types"
import { Cloud, Waves, ChevronDown, Check, TriangleAlert } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  weather:    <Cloud className="h-4 w-4" />,
  renewables: <SolarPanelIcon className="h-4 w-4" />,
  maritime:   <Waves className="h-4 w-4" />,
  risk:       <TriangleAlert className="h-4 w-4" />,
}

interface ThemeSelectorProps {
  activeTheme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

export function ThemeSelector({ activeTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="fixed left-4 top-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 h-9 px-3 rounded-lg bg-card/95 backdrop-blur-sm border border-border shadow-md text-sm font-medium text-foreground hover:bg-accent transition-colors">
            {THEME_ICONS[activeTheme]}
            <span>Forecast Themes</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" className="w-44">
          {weatherThemes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              {THEME_ICONS[theme.id]}
              <span className="flex-1">{theme.name}</span>
              {activeTheme === theme.id && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
