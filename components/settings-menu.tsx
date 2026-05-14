"use client"

import { Settings, commonTimezones, mapStyles, windSpeedUnits, WindSpeedUnit, MapStyle } from "@/lib/weather-types"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SettingsMenuProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function SettingsSection({ 
  title, 
  children 
}: { 
  title: string
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

export function SettingsMenu({ settings, onSettingsChange }: SettingsMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <SettingsIcon className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border w-80 p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <SheetTitle className="text-foreground text-lg">Settings</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Configure units and display
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Timezone */}
            <SettingsSection title="Timezone">
              <Select
                value={settings.timezone}
                onValueChange={(value) => onSettingsChange({ ...settings, timezone: value })}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {commonTimezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-sm">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsSection>

            {/* Units */}
            <SettingsSection title="Units">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Temperature</Label>
                  <Select
                    value={settings.temperatureUnit}
                    onValueChange={(value: "celsius" | "fahrenheit") =>
                      onSettingsChange({ ...settings, temperatureUnit: value })
                    }
                  >
                    <SelectTrigger className="w-28 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celsius">Celsius</SelectItem>
                      <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Wind Speed</Label>
                  <Select
                    value={settings.windSpeedUnit}
                    onValueChange={(value: WindSpeedUnit) =>
                      onSettingsChange({ ...settings, windSpeedUnit: value })
                    }
                  >
                    <SelectTrigger className="w-28 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {windSpeedUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SettingsSection>

            {/* Map */}
            <SettingsSection title="Map">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Base Map</Label>
                  <Select
                    value={settings.mapStyle}
                    onValueChange={(value: MapStyle) =>
                      onSettingsChange({ ...settings, mapStyle: value })
                    }
                  >
                    <SelectTrigger className="w-36 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mapStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Show Cities</Label>
                  <Switch
                    checked={settings.showCapitals}
                    onCheckedChange={(checked) =>
                      onSettingsChange({ ...settings, showCapitals: checked })
                    }
                  />
                </div>
              </div>
            </SettingsSection>
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t border-border mt-auto space-y-2">
          <SettingsSection title="API Key">
            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Open-Meteo API key (optional)"
                value={settings.apiKey ?? ""}
                onChange={(e) => onSettingsChange({ ...settings, apiKey: e.target.value || undefined })}
                className="h-8 text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Leave blank to use the free endpoints. Providing a key switches to commercial endpoints.
              </p>
            </div>
          </SettingsSection>
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Data from Open-Meteo API
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
