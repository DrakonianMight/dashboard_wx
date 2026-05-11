"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import useSWR from "swr"
import { WeatherMap } from "./weather-map"
import { WeatherChart } from "./weather-chart"
import { SettingsMenu } from "./settings-menu"
import { 
  SelectedLocation, 
  Settings, 
  WeatherParameter, 
  weatherParameters,
  ChartDataPoint,
} from "@/lib/weather-types"
import { fetchMultiModelForecast, processMultiModelChartData, processChartData, aggregatePrecipitationData } from "@/lib/weather-api"

const defaultSettings: Settings = {
  temperatureUnit: "celsius",
  windSpeedUnit: "kmh",
  showCapitals: true,
  mapStyle: "auto",
  timezone: "auto",
  selectedModels: ["ecmwf_ifs025"],
}

async function fetchWeatherData(
  lat: number, 
  lng: number, 
  parameterId: string,
  timezone: string,
  modelIds: string[],
  windSpeedUnit: Settings["windSpeedUnit"]
): Promise<ChartDataPoint[]> {
  const forecasts = await fetchMultiModelForecast(lat, lng, timezone, modelIds, windSpeedUnit)
  
  if (forecasts.length === 0) return []
  
  // For precipitation, use 6-hourly aggregation
  if (parameterId === "precipitation") {
    return aggregatePrecipitationData(forecasts)
  }
  
  if (modelIds.length === 1) {
    return processChartData(forecasts[0].data, parameterId)
  }
  
  return processMultiModelChartData(forecasts, parameterId)
}

const MIN_CHART_HEIGHT = 150
const MAX_CHART_HEIGHT = 500
const DEFAULT_CHART_HEIGHT = 250

export function WeatherDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [selectedParameter, setSelectedParameter] = useState<WeatherParameter>(weatherParameters[0])
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [chartHeight, setChartHeight] = useState(DEFAULT_CHART_HEIGHT)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  const { data: chartData, isLoading } = useSWR(
    selectedLocation 
      ? [
          `weather`, 
          selectedLocation.lat, 
          selectedLocation.lng, 
          selectedParameter.id, 
          settings.timezone, 
          settings.selectedModels.join(","),
          settings.windSpeedUnit
        ] 
      : null,
    () => selectedLocation 
      ? fetchWeatherData(
          selectedLocation.lat, 
          selectedLocation.lng, 
          selectedParameter.id,
          settings.timezone,
          settings.selectedModels,
          settings.windSpeedUnit
        )
      : Promise.resolve([]),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const handleLocationSelect = useCallback((location: SelectedLocation) => {
    setSelectedLocation(location)
  }, [])

  const handleParameterChange = useCallback((parameter: WeatherParameter) => {
    setSelectedParameter(parameter)
  }, [])

  const handleModelChange = useCallback((modelId: string) => {
    setSettings(prev => {
      const currentModels = prev.selectedModels
      if (currentModels.includes(modelId)) {
        // Remove model if already selected (but keep at least one)
        const newModels = currentModels.filter(id => id !== modelId)
        return { ...prev, selectedModels: newModels.length > 0 ? newModels : currentModels }
      } else {
        // Add model if not selected
        return { ...prev, selectedModels: [...currentModels, modelId] }
      }
    })
  }, [])

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings)
  }, [])

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY
      setChartHeight(Math.max(MIN_CHART_HEIGHT, Math.min(MAX_CHART_HEIGHT, newHeight)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  // Handle touch resize
  useEffect(() => {
    if (!isResizing) return

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const newHeight = window.innerHeight - touch.clientY
      setChartHeight(Math.max(MIN_CHART_HEIGHT, Math.min(MAX_CHART_HEIGHT, newHeight)))
    }

    const handleTouchEnd = () => {
      setIsResizing(false)
    }

    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isResizing])

  const locationName = selectedLocation?.name 
    ? `${selectedLocation.name}${selectedLocation.country ? `, ${selectedLocation.country}` : ""}`
    : selectedLocation 
      ? `${selectedLocation.lat.toFixed(2)}, ${selectedLocation.lng.toFixed(2)}`
      : undefined

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      <SettingsMenu settings={settings} onSettingsChange={handleSettingsChange} />
      
      {/* Main map area - takes remaining space */}
      <div 
        className="flex-1 relative min-h-0"
        style={{ height: selectedLocation ? `calc(100vh - ${chartHeight}px)` : "100vh" }}
      >
        <WeatherMap
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          settings={settings}
        />
      </div>

      {/* Resizable chart panel - only shown when location selected */}
      {selectedLocation && (
        <>
          {/* Resize handle */}
          <div
            ref={resizeRef}
            className={`
              h-2 bg-border cursor-ns-resize flex items-center justify-center
              hover:bg-muted-foreground/20 transition-colors
              ${isResizing ? "bg-muted-foreground/30" : ""}
            `}
            onMouseDown={() => setIsResizing(true)}
            onTouchStart={() => setIsResizing(true)}
          >
            <div className="w-12 h-1 rounded-full bg-muted-foreground/40" />
          </div>
          
          {/* Chart panel */}
          <div 
            className="shrink-0 border-t border-border"
            style={{ height: chartHeight }}
          >
            <WeatherChart
              data={chartData || []}
              parameter={selectedParameter}
              onParameterChange={handleParameterChange}
              onModelChange={handleModelChange}
              isLoading={isLoading}
              locationName={locationName}
              timezone={settings.timezone}
              selectedModels={settings.selectedModels}
              windSpeedUnit={settings.windSpeedUnit}
            />
          </div>
        </>
      )}
    </div>
  )
}
