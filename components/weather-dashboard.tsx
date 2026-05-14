"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import useSWR from "swr"
import { ChevronDown, ChevronUp } from "lucide-react"
import { WeatherMap } from "./weather-map"
import { WeatherChart } from "./weather-chart"
import { SettingsMenu } from "./settings-menu"
import { ModelSelector } from "./model-selector"
import { ThemeSelector } from "./theme-selector"
import {
  SelectedLocation,
  Settings,
  WeatherParameter,
  weatherThemes,
  ChartDataPoint,
  ThemeId,
} from "@/lib/weather-types"
import {
  fetchMultiModelForecast,
  fetchMarineForecast,
  fetchSolarObservations,
  processMultiModelChartData,
  processChartData,
  aggregatePrecipitationData,
} from "@/lib/weather-api"
import { weatherModels } from "@/lib/weather-types"

const defaultSettings: Settings = {
  temperatureUnit: "celsius",
  windSpeedUnit:   "kmh",
  showCapitals:    true,
  mapStyle:        "auto",
  timezone:        "auto",
  selectedModels:  ["ecmwf_ifs025"],
}

async function fetchWeatherData(
  lat: number,
  lng: number,
  parameterId: string,
  timezone: string,
  modelIds: string[],
  windSpeedUnit: Settings["windSpeedUnit"],
  temperatureUnit: Settings["temperatureUnit"],
  apiKey: string | undefined,
  themeId: ThemeId,
): Promise<ChartDataPoint[]> {
  const marineParams = new Set([
    "wave_height", "wave_direction", "wave_period",
    "swell_wave_height", "swell_wave_direction", "swell_wave_period",
    "wind_wave_height",
  ])

  const marineModelIds = modelIds.filter(id => weatherModels.find(m => m.id === id)?.endpoint === "marine")
  const nwpModelIds    = modelIds.filter(id => weatherModels.find(m => m.id === id)?.endpoint !== "marine")

  if (marineParams.has(parameterId)) {
    const marine = await fetchMarineForecast(lat, lng, timezone, apiKey, marineModelIds.length > 0 ? marineModelIds : undefined)
    if (marine.length === 0) return []
    if (marine.length === 1) return processChartData(marine[0].data, parameterId)
    return processMultiModelChartData(marine, parameterId)
  }

  const forecasts = await fetchMultiModelForecast(lat, lng, timezone, nwpModelIds, windSpeedUnit, temperatureUnit, apiKey, themeId)

  const SOLAR_OBS_PARAMS = new Set(["shortwave_radiation", "direct_radiation", "diffuse_radiation"])
  if (themeId === "renewables" && SOLAR_OBS_PARAMS.has(parameterId)) {
    const obs = await fetchSolarObservations(lat, lng, timezone, apiKey)
    if (obs) forecasts.push(obs)
  }

  if (forecasts.length === 0) return []

  if (parameterId === "precipitation") {
    return aggregatePrecipitationData(forecasts)
  }

  if (forecasts.length === 1) {
    return processChartData(forecasts[0].data, parameterId)
  }

  return processMultiModelChartData(forecasts, parameterId)
}

const MIN_CHART_HEIGHT     = 150
const MAX_CHART_HEIGHT     = 500
const DEFAULT_CHART_HEIGHT = 250

export function WeatherDashboard() {
  const [selectedLocation, setSelectedLocation]   = useState<SelectedLocation | null>(null)
  const [settings, setSettings]                   = useState<Settings>(defaultSettings)
  const [chartHeight, setChartHeight]             = useState(DEFAULT_CHART_HEIGHT)
  const [isResizing, setIsResizing]               = useState(false)
  const [activeTheme, setActiveTheme]             = useState<ThemeId>("weather")
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [chartVisible, setChartVisible]           = useState(true)
  const resizeRef = useRef<HTMLDivElement>(null)

  const themeParams = weatherThemes.find(t => t.id === activeTheme)?.parameters ?? []
  const [selectedParameter, setSelectedParameter] = useState<WeatherParameter>(themeParams[0])

  const handleThemeChange = useCallback((theme: ThemeId) => {
    setActiveTheme(theme)
    const params = weatherThemes.find(t => t.id === theme)?.parameters ?? []
    if (params.length > 0) setSelectedParameter(params[0])
  }, [])

  const { data: chartData, isLoading } = useSWR(
    selectedLocation
      ? [
          "weather",
          selectedLocation.lat,
          selectedLocation.lng,
          selectedParameter.id,
          settings.timezone,
          settings.selectedModels.join(","),
          settings.windSpeedUnit,
          settings.temperatureUnit,
          settings.apiKey ?? "",
          activeTheme,
        ]
      : null,
    () => fetchWeatherData(
      selectedLocation!.lat,
      selectedLocation!.lng,
      selectedParameter.id,
      settings.timezone,
      settings.selectedModels,
      settings.windSpeedUnit,
      settings.temperatureUnit,
      settings.apiKey,
      activeTheme,
    ),
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  )

  const handleLocationSelect  = useCallback((location: SelectedLocation) => setSelectedLocation(location), [])
  const handleParameterChange = useCallback((parameter: WeatherParameter) => setSelectedParameter(parameter), [])
  const handleSettingsChange  = useCallback((newSettings: Settings) => setSettings(newSettings), [])

  // Resize drag — mouse
  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: MouseEvent) => {
      setChartHeight(Math.max(MIN_CHART_HEIGHT, Math.min(MAX_CHART_HEIGHT, window.innerHeight - e.clientY)))
    }
    const onUp = () => setIsResizing(false)
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
  }, [isResizing])

  // Resize drag — touch
  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0]
      setChartHeight(Math.max(MIN_CHART_HEIGHT, Math.min(MAX_CHART_HEIGHT, window.innerHeight - t.clientY)))
    }
    const onEnd = () => setIsResizing(false)
    document.addEventListener("touchmove", onMove)
    document.addEventListener("touchend", onEnd)
    return () => { document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd) }
  }, [isResizing])

  const locationName = selectedLocation?.name
    ? `${selectedLocation.name}${selectedLocation.country ? `, ${selectedLocation.country}` : ""}`
    : selectedLocation
      ? `${selectedLocation.lat.toFixed(2)}, ${selectedLocation.lng.toFixed(2)}`
      : undefined

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      <ThemeSelector activeTheme={activeTheme} onThemeChange={handleThemeChange} />

      {showModelSelector && selectedLocation && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowModelSelector(false)} />
          <div className="fixed right-16 top-16 z-50">
            <ModelSelector
              settings={settings}
              onSettingsChange={handleSettingsChange}
              activeTheme={activeTheme}
            />
          </div>
        </>
      )}

      <div
        className="flex-1 relative min-h-0"
        style={{ height: selectedLocation ? (chartVisible ? `calc(100vh - ${chartHeight}px)` : "calc(100vh - 12px)") : "100vh" }}
      >
        <WeatherMap
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      </div>

      {selectedLocation && (
        <>
          <div
            ref={resizeRef}
            className={`h-3 bg-border flex items-center justify-center relative hover:bg-muted-foreground/20 transition-colors ${chartVisible ? "cursor-ns-resize" : "cursor-default"} ${isResizing ? "bg-muted-foreground/30" : ""}`}
            onMouseDown={chartVisible ? () => setIsResizing(true) : undefined}
            onTouchStart={chartVisible ? () => setIsResizing(true) : undefined}
          >
            {chartVisible && <div className="w-12 h-1 rounded-full bg-muted-foreground/40" />}
            <button
              className="absolute right-3 flex items-center justify-center h-5 w-5 rounded-full hover:bg-muted-foreground/20 transition-colors"
              onClick={() => setChartVisible(v => !v)}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {chartVisible
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>
          </div>

          {chartVisible && (
            <div className="shrink-0 border-t border-border" style={{ height: chartHeight }}>
              <WeatherChart
                data={chartData || []}
                parameter={selectedParameter}
                themeParameters={themeParams}
                onParameterChange={handleParameterChange}
                onToggleModelSelector={() => setShowModelSelector(v => !v)}
                showModelSelector={showModelSelector}
                isLoading={isLoading}
                locationName={locationName}
                timezone={settings.timezone}
                selectedModels={settings.selectedModels}
                windSpeedUnit={settings.windSpeedUnit}
                temperatureUnit={settings.temperatureUnit}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
