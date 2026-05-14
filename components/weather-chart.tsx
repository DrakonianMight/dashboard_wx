"use client"

import { useMemo } from "react"
import {
  Line,
  Bar,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  ComposedChart,
} from "recharts"
import { ChartDataPoint, WeatherParameter, weatherModels, WindSpeedUnit, windSpeedUnits } from "@/lib/weather-types"
import { formatTimeForTimezone, formatTimeShort } from "@/lib/weather-api"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RiskChart, RiskConfig } from "@/components/risk-chart"

interface WeatherChartProps {
  data: ChartDataPoint[]
  parameter: WeatherParameter
  themeParameters: WeatherParameter[]
  onParameterChange: (parameter: WeatherParameter) => void
  onToggleModelSelector: () => void
  showModelSelector: boolean
  isLoading: boolean
  locationName?: string
  timezone: string
  selectedModels: string[]
  windSpeedUnit: WindSpeedUnit
  temperatureUnit: "celsius" | "fahrenheit"
  // Risk theme
  isRiskTheme?: boolean
  poeData?: ChartDataPoint[]
  riskConfig?: RiskConfig
  onRiskConfigChange?: (config: RiskConfig) => void
}

const modelColors: Record<string, string> = {
  ecmwf_ifs025:  "hsl(200, 70%, 50%)",
  ecmwf_aifs025: "hsl(160, 70%, 45%)",
  gfs_seamless:  "hsl(30, 80%, 50%)",
  icon_seamless: "hsl(280, 60%, 55%)",
  marine:        "hsl(210, 80%, 55%)",
  ncep_aigefs025:"hsl(350, 70%, 50%)",
  satellite_obs: "hsl(45, 95%, 55%)",
}

const WIND_PARAMS = new Set(["wind_speed_10m", "wind_speed_80m", "wind_speed_120m", "wind_speed_180m"])
const TEMP_PARAMS = new Set(["temperature_2m", "apparent_temperature", "dew_point_2m"])

function getParameterUnit(parameter: WeatherParameter, windSpeedUnit: WindSpeedUnit, temperatureUnit: "celsius" | "fahrenheit"): string {
  if (WIND_PARAMS.has(parameter.id)) return windSpeedUnits.find(u => u.value === windSpeedUnit)?.symbol || "km/h"
  if (TEMP_PARAMS.has(parameter.id)) return temperatureUnit === "fahrenheit" ? "°F" : "°C"
  return parameter.unit
}

function getModelColor(modelId: string): string {
  const base = modelId.replace(/_member_\d+$/, "").replace("_ensemble", "")
  return modelColors[base] || "var(--chart-1)"
}

function getModelDisplayName(dataKey: string): string {
  const memberMatch = dataKey.match(/^(.+)_member_(\d+)$/)
  if (memberMatch) {
    const parent = weatherModels.find(m => m.id === memberMatch[1] || m.id === `${memberMatch[1]}_ensemble`)
    return `${parent?.name ?? memberMatch[1]} m${memberMatch[2]}`
  }
  const model = weatherModels.find(m => m.id === dataKey || m.id === `${dataKey}_ensemble`)
  return model?.name ?? dataKey
}

export function WeatherChart({
  data,
  parameter,
  themeParameters,
  onParameterChange,
  onToggleModelSelector,
  showModelSelector,
  isLoading,
  locationName,
  timezone,
  selectedModels,
  windSpeedUnit,
  temperatureUnit,
  isRiskTheme,
  poeData,
  riskConfig,
  onRiskConfigChange,
}: WeatherChartProps) {
  if (isRiskTheme && riskConfig && onRiskConfigChange) {
    return (
      <RiskChart
        data={poeData ?? []}
        parameter={parameter}
        themeParameters={themeParameters}
        onParameterChange={onParameterChange}
        riskConfig={riskConfig}
        onRiskConfigChange={onRiskConfigChange}
        onToggleModelSelector={onToggleModelSelector}
        showModelSelector={showModelSelector}
        isLoading={isLoading}
        locationName={locationName}
        timezone={timezone}
        selectedModels={selectedModels}
        windSpeedUnit={windSpeedUnit}
        temperatureUnit={temperatureUnit}
      />
    )
  }

  const isPrecipitation = parameter.id === "precipitation"
  const unit = getParameterUnit(parameter, windSpeedUnit, temperatureUnit)

  const { formattedData, dataKeys, nowLabel, brushStartIndex } = useMemo(() => {
    const empty = { formattedData: [] as Record<string, unknown>[], dataKeys: [] as string[], nowLabel: "", brushStartIndex: 0 }
    if (data.length === 0) return empty

    const hasModelIds = data.some(p => p.modelId !== undefined)
    let rows: Record<string, unknown>[]
    let keys: string[] = []

    if (!hasModelIds) {
      rows = data.map((point) => ({
        ...point,
        timeLabel: isPrecipitation
          ? formatTimeShort(point.time, timezone)
          : formatTimeForTimezone(point.time, timezone),
      }))
    } else {
      const timeMap = new Map<string, Record<string, unknown>>()
      const keySet  = new Set<string>()
      for (const point of data) {
        const timeLabel = isPrecipitation
          ? formatTimeShort(point.time, timezone)
          : formatTimeForTimezone(point.time, timezone)
        if (!timeMap.has(point.time)) timeMap.set(point.time, { time: point.time, timeLabel })
        if (point.modelId) {
          timeMap.get(point.time)![point.modelId] = point.value
          keySet.add(point.modelId)
        }
      }
      rows = Array.from(timeMap.values())
      keys = Array.from(keySet).sort()
    }

    const nowTs = Date.now()
    let nowLabel = "", minNowDiff = Infinity
    for (const row of rows) {
      const diff = Math.abs(new Date(row.time as string).getTime() - nowTs)
      if (diff < minNowDiff) { minNowDiff = diff; nowLabel = row.timeLabel as string }
    }

    const minus12h = nowTs - 12 * 60 * 60 * 1000
    let brushStartIndex = 0, minDiff12h = Infinity
    rows.forEach((row, i) => {
      const diff = Math.abs(new Date(row.time as string).getTime() - minus12h)
      if (diff < minDiff12h) { minDiff12h = diff; brushStartIndex = i }
    })

    return { formattedData: rows, dataKeys: keys, nowLabel, brushStartIndex }
  }, [data, timezone, isPrecipitation, parameter.id, temperatureUnit, windSpeedUnit])

  if (!locationName) return null

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading weather data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card">
        <p className="text-sm text-muted-foreground">No forecast data available for this location</p>
      </div>
    )
  }

  const tooltipStyle = {
    contentStyle: { backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--foreground)", fontSize: "12px" },
    labelStyle:   { color: "var(--foreground)", fontWeight: 500 },
  }

  const tooltipFormatter = (value: number, name: string) => {
    if (name === "satellite_obs") return [`${value.toFixed(1)} ${unit}`, "Satellite Obs"]
    const label = dataKeys.length > 0 ? getModelDisplayName(name) : (isPrecipitation ? "6h Precipitation" : parameter.name)
    return [`${value.toFixed(1)} ${unit}`, label]
  }

  const nowLine = nowLabel
    ? <ReferenceLine x={nowLabel} stroke="var(--foreground)" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Now", position: "top", style: { fill: "var(--foreground)", fontSize: 9 } }} />
    : null

  const xAxis = (minTickGap: number) => (
    <XAxis dataKey="timeLabel" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={{ stroke: "var(--border)" }} axisLine={{ stroke: "var(--border)" }} interval="preserveStartEnd" minTickGap={minTickGap} />
  )
  const yAxis = (formatter: (v: number) => string, label?: string) => (
    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={{ stroke: "var(--border)" }} axisLine={{ stroke: "var(--border)" }} width={label ? 50 : 42} tickFormatter={formatter}
      label={label ? { value: label, angle: -90, position: "insideLeft", style: { fill: "var(--muted-foreground)", fontSize: 10 } } : undefined}
    />
  )

  const brushEl = (
    <Brush dataKey="timeLabel" height={22} stroke="var(--border)" travellerWidth={6}
      fill="var(--card)" tickFormatter={() => ""}
      startIndex={brushStartIndex} endIndex={formattedData.length > 0 ? formattedData.length - 1 : 0} />
  )

  return (
    <div className="h-full w-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {/* Parameter selector — scoped to active theme */}
          <Select
            value={parameter.id}
            onValueChange={(value) => {
              const param = themeParameters.find(p => p.id === value)
              if (param) onParameterChange(param)
            }}
          >
            <SelectTrigger className="w-44 h-8 text-sm bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themeParameters.map((param) => (
                <SelectItem key={param.id} value={param.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: param.color }} />
                    {param.name} ({getParameterUnit(param, windSpeedUnit, temperatureUnit)})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Models toggle button */}
          <Button
            variant={showModelSelector ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onToggleModelSelector}
          >
            <Layers className="h-3.5 w-3.5" />
            Models ({selectedModels.length})
          </Button>

          {locationName && (
            <span className="text-xs text-muted-foreground hidden md:inline">{locationName}</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {selectedModels.map(modelId => {
            const model = weatherModels.find(m => m.id === modelId)
            return (
              <div key={modelId} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getModelColor(modelId) }} />
                <span className="text-xs text-muted-foreground">{model?.name || modelId}</span>
              </div>
            )
          })}
          {dataKeys.includes("satellite_obs") && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: modelColors.satellite_obs }} />
              <span className="text-xs text-muted-foreground">Satellite Obs</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-3 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {isPrecipitation ? (
            <ComposedChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              {xAxis(60)}
              {yAxis((v) => v.toFixed(1), `6h total (${unit})`)}
              <Tooltip {...tooltipStyle} formatter={tooltipFormatter} />
              {nowLine}
              {dataKeys.length > 0
                ? dataKeys.map(key => <Bar key={key} dataKey={key} fill={getModelColor(key)} fillOpacity={key.includes("_member_") ? 0.3 : 0.8} radius={[2, 2, 0, 0]} maxBarSize={20} />)
                : <Bar dataKey="value" fill={parameter.color} radius={[2, 2, 0, 0]} maxBarSize={24} fillOpacity={0.8} />
              }
              {brushEl}
            </ComposedChart>
          ) : (
            <ComposedChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              {xAxis(80)}
              {yAxis((v) => v.toFixed(0))}
              <Tooltip {...tooltipStyle} formatter={tooltipFormatter} />
              {nowLine}
              {dataKeys.length > 0
                ? dataKeys.map(key => {
                    if (key === "satellite_obs") return (
                      <Line key={key} type="monotone" dataKey={key} stroke={modelColors.satellite_obs} strokeWidth={2} dot={{ r: 3, fill: modelColors.satellite_obs, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} connectNulls={false} isAnimationActive={false} />
                    )
                    const isMember = key.includes("_member_")
                    return <Line key={key} type="monotone" dataKey={key} stroke={getModelColor(key)} strokeWidth={isMember ? 0.8 : 1.5} strokeOpacity={isMember ? 0.4 : 1} dot={false} activeDot={isMember ? false : { r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                  })
                : <Line type="monotone" dataKey="value" stroke={getModelColor(selectedModels[0]) || parameter.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              }
              {brushEl}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
