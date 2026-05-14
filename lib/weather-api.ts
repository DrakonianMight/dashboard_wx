import { ForecastData, ChartDataPoint, ModelForecastData, weatherModels, WindSpeedUnit, ThemeId } from "./weather-types"

// Free endpoints
const FREE_API_BASE_URL           = "https://api.open-meteo.com/v1"
const FREE_ENSEMBLE_API_BASE_URL  = "https://ensemble-api.open-meteo.com/v1"
const FREE_MARINE_API_BASE_URL    = "https://marine-api.open-meteo.com/v1"
const FREE_SATELLITE_API_BASE_URL = "https://satellite-api.open-meteo.com/v1"

// Commercial endpoints
const COMMERCIAL_API_BASE_URL           = "https://customer-api.open-meteo.com/v1"
const COMMERCIAL_ENSEMBLE_API_BASE_URL  = "https://customer-ensemble-api.open-meteo.com/v1"
const COMMERCIAL_MARINE_API_BASE_URL    = "https://customer-marine-api.open-meteo.com/v1"
const COMMERCIAL_SATELLITE_API_BASE_URL = "https://customer-satellite-api.open-meteo.com/v1"

// Model ID → Open-Meteo API model name
const MODEL_MAPPING: Record<string, string> = {
  "ecmwf_ifs025":          "ecmwf_ifs025",
  "ecmwf_aifs025":         "ecmwf_aifs025_single",
  "gfs_seamless":          "gfs_seamless",
  "icon_seamless":         "icon_seamless",
  "ecmwf_ifs025_ensemble": "ecmwf_ifs025_ensemble",
  "ecmwf_aifs025_ensemble":"ecmwf_aifs025_ensemble",
  "gfs_ensemble025":       "gfs025",
  "icon_eps_global":       "icon_eps_global",
  "ncep_aigefs025":        "ncep_aigefs025",
}

// Theme-specific parameter sets for the forecast endpoint
const THEME_PARAMS: Record<ThemeId, string> = {
  weather:    "temperature_2m,apparent_temperature,dew_point_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_speed_80m,wind_speed_120m,surface_pressure",
  renewables: "temperature_2m,shortwave_radiation,direct_radiation,diffuse_radiation,wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,surface_pressure",
  // maritime: wind params come from forecast, wave params from marine API
  maritime:   "temperature_2m,wind_speed_10m,wind_speed_80m,precipitation,surface_pressure",
  risk:       "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_speed_80m,wind_speed_120m,surface_pressure",
}

const MARINE_PARAMS = "wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,wind_wave_height"

// ─── Core fetch helper ────────────────────────────────────────────────────

async function fetchFromEndpoint(
  lat: number,
  lng: number,
  timezone: string,
  modelIds: string[],
  isEnsemble: boolean,
  windSpeedUnit: WindSpeedUnit,
  temperatureUnit: "celsius" | "fahrenheit",
  apiKey: string | undefined,
  forecastBase: string,
  ensembleBase: string,
  hourlyParams: string,
): Promise<ModelForecastData[]> {
  const baseUrl    = isEnsemble ? ensembleBase : forecastBase
  const endpoint   = isEnsemble ? "ensemble"   : "forecast"
  const apiModelIds = modelIds.map(id => MODEL_MAPPING[id] || id).join(",")
  const paramsList  = hourlyParams.split(",")

  const params = new URLSearchParams({
    latitude:        lat.toString(),
    longitude:       lng.toString(),
    timezone,
    forecast_days:   "10",
    wind_speed_unit: windSpeedUnit,
    hourly:          hourlyParams,
    models:          apiModelIds,
  })
  params.append("past_days", "1")
  if (temperatureUnit === "fahrenheit") params.append("temperature_unit", "fahrenheit")
  if (apiKey) params.append("apikey", apiKey)

  const url = `${baseUrl}/${endpoint}?${params}`
  console.log(`Fetching [${modelIds.join(", ")}] from ${url}`)

  const response = await fetch(url)
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API Error [${modelIds.join(",")}]:`, errorText)
    throw new Error(`Failed to fetch forecast for: ${modelIds.join(", ")}`)
  }

  const data = await response.json()
  const h = data.hourly
  const results: ModelForecastData[] = []

  for (const modelId of modelIds) {
    const model = weatherModels.find(m => m.id === modelId)
    if (!model) continue

    if (isEnsemble) {
      // Use first param (always temperature_2m for weather/renewables) to detect members
      const anchorParam = paramsList[0]
      const memberKeys = Object.keys(h).filter(k =>
        new RegExp(`^${anchorParam}_member\\d+$`).test(k)
      )

      for (const anchorKey of memberKeys) {
        const m = anchorKey.match(/member(\d+)$/)
        if (!m) continue
        const memberStr = m[1]
        const memberNum = parseInt(memberStr, 10)
        const vk = (v: string) => `${v}_member${memberStr}`

        const memberData: Partial<ForecastData> = { time: h.time }
        for (const param of paramsList) {
          const val = (h[vk(param)] ?? h[param]) as number[] | undefined
          if (val) (memberData as Record<string, unknown>)[param] = val
        }

        if (h[vk(anchorParam)]) {
          results.push({
            modelId:   `${modelId}_member_${memberNum}`,
            modelName: `${model.name} Member ${memberNum}`,
            data:      memberData as ForecastData,
          })
        }
      }
    } else {
      const modelDataKey = (MODEL_MAPPING[modelId] || modelId).replace(/-/g, "_")
      const modelData: Partial<ForecastData> = { time: h.time }

      for (const param of paramsList) {
        const val = (h[`${param}_${modelDataKey}`] ?? h[param]) as number[] | undefined
        if (val) (modelData as Record<string, unknown>)[param] = val
      }

      // Only push if we got at least some data
      if (h[`${paramsList[0]}_${modelDataKey}`] ?? h[paramsList[0]]) {
        results.push({
          modelId,
          modelName: model.name,
          data:      modelData as ForecastData,
        })
      }
    }
  }

  return results
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function fetchForecast(
  lat: number,
  lng: number,
  timezone = "auto",
  modelIds: string[] = ["ecmwf_ifs025"],
  windSpeedUnit: WindSpeedUnit = "kmh",
  temperatureUnit: "celsius" | "fahrenheit" = "celsius",
  apiKey?: string,
  themeId: ThemeId = "weather",
): Promise<ModelForecastData[]> {
  const useCommercial = !!apiKey
  const forecastBase  = useCommercial ? COMMERCIAL_API_BASE_URL       : FREE_API_BASE_URL
  const ensembleBase  = useCommercial ? COMMERCIAL_ENSEMBLE_API_BASE_URL : FREE_ENSEMBLE_API_BASE_URL
  const hourlyParams  = THEME_PARAMS[themeId]

  const deterministicIds = modelIds.filter(id => weatherModels.find(m => m.id === id)?.endpoint === "forecast")
  const ensembleIds      = modelIds.filter(id => weatherModels.find(m => m.id === id)?.endpoint === "ensemble")

  const requests: Promise<ModelForecastData[]>[] = []

  if (deterministicIds.length > 0) {
    requests.push(fetchFromEndpoint(lat, lng, timezone, deterministicIds, false, windSpeedUnit, temperatureUnit, apiKey, forecastBase, ensembleBase, hourlyParams))
  }

  for (const modelId of ensembleIds) {
    requests.push(fetchFromEndpoint(lat, lng, timezone, [modelId], true, windSpeedUnit, temperatureUnit, apiKey, forecastBase, ensembleBase, hourlyParams))
  }

  const grouped = await Promise.all(requests)
  return grouped.flat()
}

export const fetchMultiModelForecast = fetchForecast

const MARINE_MODEL_MAPPING: Record<string, string> = {
  ecmwf_wam025: "ecmwf_wam025",
  gfs_wave025:  "gfs_wave025",
}

const MARINE_MODEL_NAMES: Record<string, string> = {
  ecmwf_wam025: "ECMWF WAM",
  gfs_wave025:  "GFS Wave",
}

async function fetchSingleMarineModel(
  lat: number,
  lng: number,
  timezone: string,
  apiKey: string | undefined,
  base: string,
  modelId?: string,
): Promise<ModelForecastData | null> {
  const params = new URLSearchParams({
    latitude:      lat.toString(),
    longitude:     lng.toString(),
    timezone,
    forecast_days: "7",
    hourly:        MARINE_PARAMS,
  })
  if (modelId) params.append("models", MARINE_MODEL_MAPPING[modelId] || modelId)
  if (apiKey) params.append("apikey", apiKey)

  const response = await fetch(`${base}/marine?${params}`)
  if (!response.ok) {
    console.warn(`Marine API error [${modelId ?? "best"}]:`, await response.text())
    return null
  }

  const data = await response.json()
  const h = data.hourly
  if (!h?.time) return null

  return {
    modelId:   modelId ?? "marine",
    modelName: modelId ? (MARINE_MODEL_NAMES[modelId] ?? modelId) : "Marine Forecast",
    data: {
      time:                 h.time,
      wave_height:          h.wave_height,
      wave_direction:       h.wave_direction,
      wave_period:          h.wave_period,
      swell_wave_height:    h.swell_wave_height,
      swell_wave_direction: h.swell_wave_direction,
      swell_wave_period:    h.swell_wave_period,
      wind_wave_height:     h.wind_wave_height,
    },
  }
}

export async function fetchMarineForecast(
  lat: number,
  lng: number,
  timezone: string,
  apiKey?: string,
  marineModelIds?: string[],
): Promise<ModelForecastData[]> {
  const base = apiKey ? COMMERCIAL_MARINE_API_BASE_URL : FREE_MARINE_API_BASE_URL

  // If specific models selected, one request per model; otherwise best-match single request
  const ids = (marineModelIds && marineModelIds.length > 0) ? marineModelIds : [undefined]
  const results = await Promise.all(ids.map(id => fetchSingleMarineModel(lat, lng, timezone, apiKey, base, id)))
  return results.filter((r): r is ModelForecastData => r !== null)
}

export async function fetchSolarObservations(
  lat: number,
  lng: number,
  timezone: string,
  apiKey?: string,
): Promise<ModelForecastData | null> {
  const base = apiKey ? COMMERCIAL_SATELLITE_API_BASE_URL : FREE_SATELLITE_API_BASE_URL

  const now       = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const fmt = (d: Date) => d.toISOString().split("T")[0]

  const params = new URLSearchParams({
    latitude:   lat.toString(),
    longitude:  lng.toString(),
    timezone,
    start_date: fmt(yesterday),
    end_date:   fmt(now),
    hourly:     "shortwave_radiation,direct_radiation,diffuse_radiation",
    models:     "satellite_radiation_seamless",
  })
  if (apiKey) params.append("apikey", apiKey)

  const response = await fetch(`${base}/archive?${params}`)
  if (!response.ok) return null

  const data = await response.json()
  const h = data.hourly
  if (!h?.time) return null

  const nowTs  = Date.now()
  const cutoff = nowTs - 12 * 60 * 60 * 1000

  const times  = h.time as string[]
  // Archive endpoint may return plain keys or model-prefixed keys
  const swArr  = (h.shortwave_radiation_satellite_radiation_seamless ?? h.shortwave_radiation) as number[] | undefined
  const dirArr = (h.direct_radiation_satellite_radiation_seamless   ?? h.direct_radiation)    as number[] | undefined
  const difArr = (h.diffuse_radiation_satellite_radiation_seamless  ?? h.diffuse_radiation)   as number[] | undefined

  const filtTimes: string[] = []
  const filtSwr:   number[] = []
  const filtDir:   number[] = []
  const filtDif:   number[] = []

  times.forEach((t, i) => {
    const ts = new Date(t).getTime()
    if (ts < cutoff || ts > nowTs) return
    filtTimes.push(t)
    filtSwr.push(swArr?.[i]  ?? 0)
    filtDir.push(dirArr?.[i] ?? 0)
    filtDif.push(difArr?.[i] ?? 0)
  })

  if (filtTimes.length === 0) return null

  const solarData: Partial<ForecastData> & { time: string[] } = { time: filtTimes }
  if (swArr  !== undefined) solarData.shortwave_radiation = filtSwr
  if (dirArr !== undefined) solarData.direct_radiation    = filtDir
  if (difArr !== undefined) solarData.diffuse_radiation   = filtDif

  return {
    modelId:   "satellite_obs",
    modelName: "Satellite Obs",
    data:      solarData as ForecastData,
  }
}

// ─── Chart data processing ────────────────────────────────────────────────

export function processChartData(
  forecast: ForecastData,
  parameterId: string
): ChartDataPoint[] {
  const values = forecast[parameterId as keyof ForecastData] as number[] | undefined
  if (!values || !forecast.time) return []

  return forecast.time.map((time, index) => ({
    time,
    value: values[index] ?? 0,
    type:  "forecast" as const,
  }))
}

export function processMultiModelChartData(
  forecasts: ModelForecastData[],
  parameterId: string
): ChartDataPoint[] {
  const allPoints: ChartDataPoint[] = []

  for (const forecast of forecasts) {
    const values = forecast.data[parameterId as keyof ForecastData] as number[] | undefined
    if (!values || !forecast.data.time) continue

    forecast.data.time.forEach((time, index) => {
      allPoints.push({
        time,
        value:     values[index] ?? 0,
        type:      "forecast" as const,
        modelId:   forecast.modelId,
        modelName: forecast.modelName,
      })
    })
  }

  return allPoints
}

export function aggregatePrecipitationData(
  forecasts: ModelForecastData[]
): ChartDataPoint[] {
  const allPoints: ChartDataPoint[] = []

  for (const forecast of forecasts) {
    const values = forecast.data.precipitation
    const times  = forecast.data.time
    if (!values || !times) continue

    const periodMap = new Map<string, { sum: number }>()

    times.forEach((time, index) => {
      const date        = new Date(time)
      const periodStart = Math.floor(date.getHours() / 6) * 6
      date.setHours(periodStart, 0, 0, 0)
      const key = date.toISOString()
      if (!periodMap.has(key)) periodMap.set(key, { sum: 0 })
      periodMap.get(key)!.sum += values[index] ?? 0
    })

    periodMap.forEach((data, key) => {
      allPoints.push({
        time:      key,
        value:     Math.round(data.sum * 10) / 10,
        type:      "forecast" as const,
        modelId:   forecast.modelId,
        modelName: forecast.modelName,
      })
    })
  }

  allPoints.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  return allPoints
}

export function formatTimeForTimezone(isoTime: string, timezone: string): string {
  try {
    return new Date(isoTime).toLocaleString("en-AU", {
      timeZone: timezone === "auto" ? undefined : timezone,
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
    })
  } catch {
    return new Date(isoTime).toLocaleString("en-AU", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
    })
  }
}

export function formatTimeShort(isoTime: string, timezone: string): string {
  try {
    return new Date(isoTime).toLocaleString("en-AU", {
      timeZone: timezone === "auto" ? undefined : timezone,
      month: "short", day: "numeric", hour: "2-digit", hour12: false,
    })
  } catch {
    return new Date(isoTime).toLocaleString("en-AU", {
      month: "short", day: "numeric", hour: "2-digit", hour12: false,
    })
  }
}

export function computeProbabilityOfExceedance(
  points: ChartDataPoint[],
  threshold: number,
  direction: "above" | "below",
): ChartDataPoint[] {
  const timeMap = new Map<string, number[]>()
  for (const p of points) {
    if (!timeMap.has(p.time)) timeMap.set(p.time, [])
    timeMap.get(p.time)!.push(p.value)
  }
  const result: ChartDataPoint[] = []
  timeMap.forEach((members, time) => {
    const count = direction === "above"
      ? members.filter(v => v >= threshold).length
      : members.filter(v => v <= threshold).length
    result.push({
      time,
      value:   Math.round(count / members.length * 100),
      type:    "forecast" as const,
      modelId: "ensemble_poe",
    })
  })
  return result.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}
