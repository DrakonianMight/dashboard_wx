"use client"

import { Settings, weatherModels } from "@/lib/weather-types"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

interface ModelSelectorProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

export function ModelSelector({ settings, onSettingsChange }: ModelSelectorProps) {
  const handleModelToggle = (modelId: string, checked: boolean) => {
    let newModels: string[]
    if (checked) {
      newModels = [...settings.selectedModels, modelId]
    } else {
      newModels = settings.selectedModels.filter(id => id !== modelId)
      if (newModels.length === 0) {
        return // Ensure at least one model is selected
      }
    }
    onSettingsChange({ ...settings, selectedModels: newModels })
  }

  const deterministicModels = weatherModels.filter(m => m.type === "deterministic")
  const ensembleModels = weatherModels.filter(m => m.type === "ensemble")

  return (
    <Card className="absolute right-4 top-16 w-80 bg-card/95 backdrop-blur-sm border-border shadow-lg z-40">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Deterministic Models</h3>
          <ScrollArea className="h-40">
            <div className="space-y-2 pr-4">
              {deterministicModels.map((model) => (
                <div key={model.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={model.id}
                    checked={settings.selectedModels.includes(model.id)}
                    onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <Label 
                      htmlFor={model.id} 
                      className="text-xs font-medium text-foreground cursor-pointer block"
                    >
                      {model.name}
                    </Label>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Ensemble Models</h3>
          <ScrollArea className="h-40">
            <div className="space-y-2 pr-4">
              {ensembleModels.map((model) => (
                <div key={model.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={model.id}
                    checked={settings.selectedModels.includes(model.id)}
                    onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <Label 
                      htmlFor={model.id} 
                      className="text-xs font-medium text-foreground cursor-pointer block"
                    >
                      {model.name}
                    </Label>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Selected: {settings.selectedModels.length} model(s)
          </p>
        </div>
      </div>
    </Card>
  )
}
