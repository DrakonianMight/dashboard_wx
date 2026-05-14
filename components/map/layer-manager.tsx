"use client"

import { CloudRain, Layers } from "lucide-react"
import { useMapTimeStore } from "@/lib/map-time-store"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"

export function LayerManager() {
  const { layers, setLayerVisible, setLayerOpacity } = useMapTimeStore()

  return (
    <div className="absolute top-4 right-4 z-10">
      <Card className="bg-card/95 backdrop-blur-sm border-border shadow-lg w-52">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Layers</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-foreground">Radar</span>
              </div>
              <Switch
                checked={layers.radar.visible}
                onCheckedChange={(v) => setLayerVisible("radar", v)}
              />
            </div>
            {layers.radar.visible && (
              <Slider
                value={[Math.round(layers.radar.opacity * 100)]}
                min={10}
                max={100}
                step={5}
                onValueChange={([v]) => setLayerOpacity("radar", v / 100)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
