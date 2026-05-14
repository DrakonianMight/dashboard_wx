"use client"

import { useState } from "react"
import { CloudRain, ChevronDown, ChevronUp, Layers, Satellite } from "lucide-react"
import { useMapTimeStore } from "@/lib/map-time-store"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { SettingsMenu } from "@/components/settings-menu"
import { Settings } from "@/lib/weather-types"

type LayerId = keyof ReturnType<typeof useMapTimeStore.getState>["layers"]

const LAYER_ROWS: { id: LayerId; label: string; Icon: React.ElementType; iconClass: string; group: string }[] = [
  { id: "radar",     label: "Radar",     Icon: CloudRain, iconClass: "text-blue-400",   group: "imagery" },
  { id: "satellite", label: "Satellite", Icon: Satellite, iconClass: "text-orange-400", group: "imagery" },
]

interface LayerManagerProps {
  settings: Settings
  onSettingsChange: (s: Settings) => void
}

export function LayerManager({ settings, onSettingsChange }: LayerManagerProps) {
  const [expanded, setExpanded] = useState(false)
  const { layers, setLayerVisible, setLayerOpacity } = useMapTimeStore()

  function handleToggle(id: LayerId, checked: boolean) {
    if (checked) {
      const row = LAYER_ROWS.find((r) => r.id === id)
      LAYER_ROWS.filter((r) => r.group === row?.group && r.id !== id)
        .forEach((r) => setLayerVisible(r.id, false))
    }
    setLayerVisible(id, checked)
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      <Card className="bg-card/95 backdrop-blur-sm border-border shadow-lg w-44 py-0">
        <CardContent className="p-2">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Layers</span>
            </div>
            <div className="flex items-center gap-1">
              <div onClick={(e) => e.stopPropagation()}>
                <SettingsMenu settings={settings} onSettingsChange={onSettingsChange} />
              </div>
              {expanded
                ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </div>
          </div>

          {expanded && (
            <div className="mt-2 pt-2 border-t border-border space-y-2">
              {LAYER_ROWS.map(({ id, label, Icon, iconClass }) => (
                <div key={id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => handleToggle(id, true)}
                    >
                      <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
                      <span className="text-xs text-foreground">{label}</span>
                    </button>
                    <Switch
                      checked={layers[id].visible}
                      onCheckedChange={(v) => handleToggle(id, v)}
                    />
                  </div>
                  {layers[id].visible && (
                    <Slider
                      value={[Math.round(layers[id].opacity * 100)]}
                      min={10}
                      max={100}
                      step={5}
                      onValueChange={([v]) => setLayerOpacity(id, v / 100)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
