"use client"

import { useMemo } from "react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import { ChartDataPoint, WeatherParameter, weatherParameters, weatherModels, WindSpeedUnit, windSpeedUnits } from "@/lib/weather-types"
import { formatTimeForTimezone, formatTimeShort } from "@/lib/weather-api"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface WeatherChartProps {
  data: ChartDataPoint[]
  parameter: WeatherParameter
  onParameterChange: (parameter: WeatherParameter) => void
  onModelChange: (modelId: string) => void
  isLoading: boolean
  locationName?: string
  timezone: string
  selectedModels: string[]
  windSpeedUnit: WindSpeedUnit
}

const modelColors: Record<string, string> = {
  // Deterministic models
  ecmwf_ifs025: "hsl(200, 70%, 50%)",
  ecmwf_aifs025: "hsl(160, 70%, 45%)",
  gfs_seamless: "hsl(30, 80%, 50%)",
  icon_seamless: "hsl(280, 60%, 55%)",
  bom_access_global: "hsl(350, 70%, 50%)",
  // Ensemble models use the same color as their parent deterministic model
}

function getParameterUnit(parameter: WeatherParameter, windSpeedUnit: WindSpeedUnit): string {
  if (parameter.id === "wind_speed_10m") {
    return windSpeedUnits.find(u => u.value === windSpeedUnit)?.symbol || "km/h"
  }
  return parameter.unit
}

function getModelColor(modelId: string): string {
  // Strip "_ensemble" suffix for color lookup to use parent model color
  const colorModelId = modelId.replace("_ensemble", "")
  return modelColors[colorModelId] || "var(--chart-1)"
}

function getModelNameFromDataKey(dataKey: string, selectedModels: string[]): string {
  // Find the full model ID that matches this dataKey (accounting for stripped ensemble suffix)
  const fullModelId = selectedModels.find(mid => mid.replace("_ensemble", "") === dataKey) || dataKey
  const model = weatherModels.find(m => m.id === fullModelId)
  return model?.name || dataKey
}

export function WeatherChart({ 
  data, 
  parameter, 
  onParameterChange,
  onModelChange,
  isLoading, 
  locationName,
  timezone,
  selectedModels,
  windSpeedUnit,
}: WeatherChartProps) {
  const isPrecipitation = parameter.id === "precipitation"
  const unit = getParameterUnit(parameter, windSpeedUnit)
  
  const formattedData = useMemo(() => {
    if (data.length === 0) return []
    
    if (selectedModels.length <= 1) {
      return data.map((point) => ({
        ...point,
        timeLabel: isPrecipitation 
          ? formatTimeShort(point.time, timezone)
          : formatTimeForTimezone(point.time, timezone),
      }))
    }

    // Group data by time for multi-model comparison
    const timeMap = new Map<string, Record<string, number | string>>()
    
    for (const point of data) {
      const timeLabel = isPrecipitation 
        ? formatTimeShort(point.time, timezone)
        : formatTimeForTimezone(point.time, timezone)
      if (!timeMap.has(point.time)) {
        timeMap.set(point.time, { time: point.time, timeLabel })
      }
      const entry = timeMap.get(point.time)!
      if (point.modelId) {
        entry[point.modelId] = point.value
      }
    }
    
    return Array.from(timeMap.values())
  }, [data, timezone, selectedModels.length, isPrecipitation])

  if (!locationName) {
    return null
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading weather data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card">
        <p className="text-sm text-muted-foreground">
          No forecast data available for this location
        </p>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Select
            value={parameter.id}
            onValueChange={(value) => {
              const param = weatherParameters.find(p => p.id === value)
              if (param) onParameterChange(param)
            }}
          >
            <SelectTrigger className="w-48 h-8 text-sm bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weatherParameters.map((param) => (
                <SelectItem key={param.id} value={param.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: param.color }}
                    />
                    {param.name} ({param.id === "wind_speed_10m" ? unit : param.unit})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={selectedModels[0] || "ecmwf_ifs025"}
            onValueChange={onModelChange}
          >
            <SelectTrigger className="w-48 h-8 text-sm bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weatherModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getModelColor(model.id) }}
                    />
                    {model.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {locationName && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {locationName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedModels.map(modelId => {
            const model = weatherModels.find(m => m.id === modelId)
            return (
              <div key={modelId} className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: getModelColor(modelId) }}
                />
                <span className="text-xs text-muted-foreground">{model?.name || modelId}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex-1 p-3 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {isPrecipitation ? (
            <BarChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--border)" 
                vertical={false}
              />
              <XAxis
                dataKey="timeLabel"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                width={40}
                tickFormatter={(value) => value.toFixed(1)}
                label={{ 
                  value: `6h total (${unit})`, 
                  angle: -90, 
                  position: "insideLeft",
                  style: { fill: "var(--muted-foreground)", fontSize: 10 }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--foreground)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
                formatter={(value: number, name: string) => {
                  const modelName = selectedModels.length > 1 
                    ? getModelNameFromDataKey(name, selectedModels)
                    : "6h Precipitation"
                  return [`${value.toFixed(1)} ${unit}`, modelName]
                }}
              />
              {selectedModels.length > 1 ? (
                selectedModels.map(modelId => (
                  <Bar
                    key={modelId}
                    dataKey={modelId.replace("_ensemble", "")}
                    fill={getModelColor(modelId)}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  />
                ))
              ) : (
                <Bar
                  dataKey="value"
                  fill={parameter.color}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={24}
                >
                  {formattedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={parameter.color}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          ) : (
            <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--border)" 
                vertical={false}
              />
              <XAxis
                dataKey="timeLabel"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                interval="preserveStartEnd"
                minTickGap={80}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                width={45}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--foreground)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
                formatter={(value: number, name: string) => {
                  const modelName = selectedModels.length > 1 
                    ? getModelNameFromDataKey(name, selectedModels)
                    : parameter.name
                  return [`${value.toFixed(1)} ${unit}`, modelName]
                }}
              />
              {selectedModels.length > 1 ? (
                selectedModels.map(modelId => (
                  <Line
                    key={modelId}
                    type="monotone"
                    dataKey={modelId.replace("_ensemble", "")}
                    stroke={getModelColor(modelId)}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={getModelColor(selectedModels[0]) || parameter.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
