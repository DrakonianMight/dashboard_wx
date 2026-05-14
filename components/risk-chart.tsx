"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import { ChartDataPoint, WeatherParameter, weatherModels, WindSpeedUnit, windSpeedUnits } from "@/lib/weather-types"
import { formatTimeForTimezone, formatTimeShort } from "@/lib/weather-api"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Layers } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface RiskConfig {
  threshold: number
  direction: "above" | "below"
}

const WIND_PARAMS = new Set(["wind_speed_10m", "wind_speed_80m", "wind_speed_120m", "wind_speed_180m"])
const TEMP_PARAMS = new Set(["temperature_2m", "apparent_temperature", "dew_point_2m"])

function getParameterUnit(parameter: WeatherParameter, windSpeedUnit: WindSpeedUnit, temperatureUnit: "celsius" | "fahrenheit"): string {
  if (WIND_PARAMS.has(parameter.id)) return windSpeedUnits.find(u => u.value === windSpeedUnit)?.symbol || "km/h"
  if (TEMP_PARAMS.has(parameter.id)) return temperatureUnit === "fahrenheit" ? "°F" : "°C"
  return parameter.unit
}

interface RiskChartProps {
  data: ChartDataPoint[]
  parameter: WeatherParameter
  themeParameters: WeatherParameter[]
  onParameterChange: (parameter: WeatherParameter) => void
  riskConfig: RiskConfig
  onRiskConfigChange: (config: RiskConfig) => void
  onToggleModelSelector: () => void
  showModelSelector: boolean
  isLoading: boolean
  locationName?: string
  timezone: string
  selectedModels: string[]
  windSpeedUnit: WindSpeedUnit
  temperatureUnit: "celsius" | "fahrenheit"
}

export function RiskChart({
  data,
  parameter,
  themeParameters,
  onParameterChange,
  riskConfig,
  onRiskConfigChange,
  onToggleModelSelector,
  showModelSelector,
  isLoading,
  locationName,
  timezone,
  selectedModels,
  windSpeedUnit,
  temperatureUnit,
}: RiskChartProps) {
  const unit = getParameterUnit(parameter, windSpeedUnit, temperatureUnit)
  const isPrecip = parameter.id === "precipitation"

  const { formattedData, nowLabel, brushStartIndex } = useMemo(() => {
    const empty = { formattedData: [] as Record<string, unknown>[], nowLabel: "", brushStartIndex: 0 }
    if (data.length === 0) return empty

    const rows = data.map(p => ({
      ...p,
      timeLabel: isPrecip
        ? formatTimeShort(p.time, timezone)
        : formatTimeForTimezone(p.time, timezone),
    }))

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

    return { formattedData: rows, nowLabel, brushStartIndex }
  }, [data, timezone, isPrecip])

  if (!locationName) return null

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading ensemble data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card">
        <p className="text-sm text-muted-foreground">No ensemble data available — select an ensemble model</p>
      </div>
    )
  }

  const tooltipStyle = {
    contentStyle: { backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--foreground)", fontSize: "12px" },
    labelStyle:   { color: "var(--foreground)", fontWeight: 500 },
  }

  const tooltipFormatter = (value: number) => {
    const dir = riskConfig.direction === "above" ? "≥" : "≤"
    return [`${value}%`, `P(${parameter.name} ${dir} ${riskConfig.threshold}${unit})`]
  }

  const dirLabel = riskConfig.direction === "above"
    ? `P(${parameter.name} ≥ ${riskConfig.threshold} ${unit})`
    : `P(${parameter.name} ≤ ${riskConfig.threshold} ${unit})`

  const ensembleCount = selectedModels.filter(id => weatherModels.find(m => m.id === id)?.type === "ensemble").length

  return (
    <div className="h-full w-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
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

          <Button
            variant={showModelSelector ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onToggleModelSelector}
          >
            <Layers className="h-3.5 w-3.5" />
            Ensembles ({ensembleCount})
          </Button>

          {locationName && (
            <span className="text-xs text-muted-foreground hidden md:inline">{locationName}</span>
          )}
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline">{dirLabel}</span>
      </div>

      {/* Threshold controls */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border shrink-0 bg-muted/30">
        <span className="text-xs text-muted-foreground">Threshold:</span>
        <Input
          type="number"
          value={riskConfig.threshold}
          onChange={(e) => onRiskConfigChange({ ...riskConfig, threshold: parseFloat(e.target.value) || 0 })}
          className="h-7 w-24 text-xs"
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
        <div className="flex rounded-md overflow-hidden border border-border">
          <button
            className={`px-3 py-1 text-xs transition-colors ${riskConfig.direction === "above" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            onClick={() => onRiskConfigChange({ ...riskConfig, direction: "above" })}
          >
            ≥ Above
          </button>
          <button
            className={`px-3 py-1 text-xs transition-colors border-l border-border ${riskConfig.direction === "below" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            onClick={() => onRiskConfigChange({ ...riskConfig, direction: "below" })}
          >
            ≤ Below
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-3 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
            <defs>
              <linearGradient id="poeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(220,70%,55%)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="hsl(220,70%,55%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={{ stroke: "var(--border)" }}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
              minTickGap={80}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={{ stroke: "var(--border)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickFormatter={(v) => `${v}%`}
              width={42}
            />
            <Tooltip {...tooltipStyle} formatter={tooltipFormatter} />
            {nowLabel && (
              <ReferenceLine
                x={nowLabel}
                stroke="var(--foreground)"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: "Now", position: "top", style: { fill: "var(--foreground)", fontSize: 9 } }}
              />
            )}
            <ReferenceLine y={50} stroke="hsl(0,0%,55%)" strokeDasharray="4 4" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(220,70%,55%)"
              strokeWidth={2}
              fill="url(#poeGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(220,70%,55%)" }}
              isAnimationActive={false}
            />
            <Brush
              dataKey="timeLabel"
              height={22}
              stroke="var(--border)"
              travellerWidth={6}
              fill="var(--card)"
              tickFormatter={() => ""}
              startIndex={brushStartIndex}
              endIndex={formattedData.length > 0 ? formattedData.length - 1 : 0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
