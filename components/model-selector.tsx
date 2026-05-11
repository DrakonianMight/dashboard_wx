"use client"

import { Settings, weatherModels, ThemeId } from "@/lib/weather-types"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

interface ModelSelectorProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  activeTheme: ThemeId
}

function ModelGroup({
  title,
  models,
  selectedModels,
  onToggle,
}: {
  title: string
  models: typeof weatherModels
  selectedModels: string[]
  onToggle: (id: string, checked: boolean) => void
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <ScrollArea className="max-h-36">
        <div className="space-y-2 pr-2">
          {models.map((model) => (
            <div key={model.id} className="flex items-start gap-2">
              <Checkbox
                id={model.id}
                checked={selectedModels.includes(model.id)}
                onCheckedChange={(checked) => onToggle(model.id, checked as boolean)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={model.id} className="text-xs font-medium text-foreground cursor-pointer block leading-tight">
                  {model.name}
                </Label>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{model.description}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export function ModelSelector({ settings, onSettingsChange, activeTheme }: ModelSelectorProps) {
  const handleToggle = (modelId: string, checked: boolean) => {
    const current = settings.selectedModels
    if (checked) {
      onSettingsChange({ ...settings, selectedModels: [...current, modelId] })
    } else {
      const next = current.filter(id => id !== modelId)
      if (next.length > 0) onSettingsChange({ ...settings, selectedModels: next })
    }
  }

  const deterministicModels = weatherModels.filter(m => m.type === "deterministic" && m.endpoint === "forecast")
  const ensembleModels      = weatherModels.filter(m => m.endpoint === "ensemble")
  const waveModels          = weatherModels.filter(m => m.endpoint === "marine")

  const showNWP  = activeTheme !== "maritime" || true  // NWP wind always useful in maritime
  const showWave = activeTheme === "maritime"

  return (
    <Card className="w-72 bg-card/95 backdrop-blur-sm border-border shadow-xl">
      <div className="p-4 space-y-4">
        {showNWP && (
          <>
            <ModelGroup
              title="Deterministic"
              models={deterministicModels}
              selectedModels={settings.selectedModels}
              onToggle={handleToggle}
            />
            <div className="border-t border-border pt-3">
              <ModelGroup
                title="Ensemble"
                models={ensembleModels}
                selectedModels={settings.selectedModels}
                onToggle={handleToggle}
              />
            </div>
          </>
        )}

        {showWave && (
          <div className={showNWP ? "border-t border-border pt-3" : ""}>
            <ModelGroup
              title="Wave Models"
              models={waveModels}
              selectedModels={settings.selectedModels}
              onToggle={handleToggle}
            />
          </div>
        )}

        <div className="border-t border-border pt-2">
          <p className="text-[10px] text-muted-foreground">
            {settings.selectedModels.length} model{settings.selectedModels.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      </div>
    </Card>
  )
}
