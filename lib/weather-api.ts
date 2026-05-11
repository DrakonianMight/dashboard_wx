import { ForecastData, ChartDataPoint, ModelForecastData, weatherModels, WindSpeedUnit } from "./weather-types"

const API_BASE_URL = "https://api.open-meteo.com/v1"
const ENSEMBLE_API_BASE_URL = "https://ensemble-api.open-meteo.com/v1"

export async function fetchForecast(
  lat: number, 
  lng: number,
  timezone: string = "auto",
  modelIds: string[] = ["ecmwf_ifs025"],
  windSpeedUnit: WindSpeedUnit = "kmh"
): Promise<ModelForecastData[]> {
  // Check if any model is ensemble
  const hasEnsemble = modelIds.some(id => weatherModels.find(m => m.id === id)?.endpoint === "ensemble")
  const baseUrl = hasEnsemble ? ENSEMBLE_API_BASE_URL : API_BASE_URL
  
  // Map model IDs to API model names
  const modelMapping: Record<string, string> = {
    // Deterministic models
    "ecmwf_ifs025": "ecmwf_ifs025",
    "ecmwf_aifs025": "ecmwf_aifs025",
    "gfs_seamless": "gfs_seamless",
    "icon_seamless": "icon_seamless",
    "bom_access_global": "bom_access_global",
    // Ensemble models - use full model names for ensemble endpoint
    "ecmwf_ifs025_ensemble": "ecmwf_ifs025_ensemble",
    "ecmwf_aifs025_ensemble": "ecmwf_aifs025_ensemble",
    "gfs_ensemble025": "gfs_ensemble025",
    "icon_eps_global": "icon_eps_global",
  }
  
  const apiModelIds = modelIds.map(id => modelMapping[id] || id).join(",")
  
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    timezone: timezone,
    forecast_days: "7",
    wind_speed_unit: windSpeedUnit,
  })
  
  // Hourly parameters - ensemble API may have limitations
  const hourlyParams = "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,surface_pressure"
  params.append("hourly", hourlyParams)
  params.append("models", apiModelIds)

  const endpoint = hasEnsemble ? "ensemble" : "forecast"
  const url = `${baseUrl}/${endpoint}?${params}`
  console.log(`Fetching models [${modelIds.join(", ")}] from ${url}`)
  
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API Error for ${modelIds.join(", ")}:`, errorText, `endpoint: ${endpoint}`)
    throw new Error(`Failed to fetch forecast data for models: ${modelIds.join(", ")}`)
  }

  const data = await response.json()
  const results: ModelForecastData[] = []
  
  // Parse response - structure depends on whether models or model was used
  const hourlyData = data.hourly
  
  // For each model, extract its data
  for (const modelId of modelIds) {
    const model = weatherModels.find(m => m.id === modelId)
    if (!model) continue
    
    const apiModelId = modelMapping[modelId] || modelId
    const modelDataKey = apiModelId.replace(/-/g, "_")
    
    // Try to find the model's data in the response
    let modelTemp: number[] | undefined
    let modelHumidity: number[] | undefined
    let modelPrecip: number[] | undefined
    let modelWind: number[] | undefined
    let modelPressure: number[] | undefined
    
    // Check if data is keyed by model name (multi-model response)
    if (hourlyData[`temperature_2m_${modelDataKey}`]) {
      modelTemp = hourlyData[`temperature_2m_${modelDataKey}`]
      modelHumidity = hourlyData[`relative_humidity_2m_${modelDataKey}`]
      modelPrecip = hourlyData[`precipitation_${modelDataKey}`]
      modelWind = hourlyData[`wind_speed_10m_${modelDataKey}`]
      modelPressure = hourlyData[`surface_pressure_${modelDataKey}`]
    } else {
      // Single model response
      modelTemp = hourlyData.temperature_2m
      modelHumidity = hourlyData.relative_humidity_2m
      modelPrecip = hourlyData.precipitation
      modelWind = hourlyData.wind_speed_10m
      modelPressure = hourlyData.surface_pressure
    }
    
    if (modelTemp && modelHumidity !== undefined && modelPrecip !== undefined && modelWind !== undefined) {
      results.push({
        modelId,
        modelName: model.name,
        data: {
          time: hourlyData.time,
          temperature_2m: modelTemp,
          relative_humidity_2m: modelHumidity,
          precipitation: modelPrecip,
          wind_speed_10m: modelWind,
          surface_pressure: modelPressure || Array(hourlyData.time.length).fill(0),
        }
      })
    }
  }
  
  return results
}

// Alias for backwards compatibility
export const fetchMultiModelForecast = fetchForecast

export function processChartData(
  forecast: ForecastData,
  parameterId: string
): ChartDataPoint[] {
  const values = forecast[parameterId as keyof ForecastData] as number[] | undefined
  
  if (!values || !forecast.time) {
    return []
  }

  return forecast.time.map((time, index) => ({
    time,
    value: values[index] ?? 0,
    type: "forecast" as const,
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
    
    // Determine the color group (for ensemble members, use parent model ID)
    const colorGroupId = forecast.modelId.replace("_ensemble", "")
    
    forecast.data.time.forEach((time, index) => {
      allPoints.push({
        time,
        value: values[index] ?? 0,
        type: "forecast" as const,
        modelId: colorGroupId,
        modelName: forecast.modelName,
      })
    })
  }
  
  return allPoints
}

// Aggregate precipitation data to 6-hourly periods
export function aggregatePrecipitationData(
  forecasts: ModelForecastData[]
): ChartDataPoint[] {
  const allPoints: ChartDataPoint[] = []
  
  for (const forecast of forecasts) {
    const values = forecast.data.precipitation
    const times = forecast.data.time
    
    if (!values || !times) continue
    
    // Group by 6-hour periods
    const periodMap = new Map<string, { sum: number; startTime: string }>()
    
    times.forEach((time, index) => {
      const date = new Date(time)
      const hour = date.getHours()
      const periodStart = Math.floor(hour / 6) * 6
      date.setHours(periodStart, 0, 0, 0)
      const periodKey = date.toISOString()
      
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, { sum: 0, startTime: time })
      }
      periodMap.get(periodKey)!.sum += values[index] ?? 0
    })
    
    // Determine the color group (for ensemble members, use parent model ID)
    const colorGroupId = forecast.modelId.replace("_ensemble", "")
    
    // Convert to chart points
    periodMap.forEach((data, periodKey) => {
      allPoints.push({
        time: periodKey,
        value: Math.round(data.sum * 10) / 10, // Round to 1 decimal
        type: "forecast" as const,
        modelId: colorGroupId,
        modelName: forecast.modelName,
      })
    })
  }
  
  // Sort by time
  allPoints.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  
  return allPoints
}

export function formatTimeForTimezone(isoTime: string, timezone: string): string {
  try {
    const date = new Date(isoTime)
    return date.toLocaleString("en-AU", {
      timeZone: timezone === "auto" ? undefined : timezone,
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return new Date(isoTime).toLocaleString("en-AU", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }
}

export function formatTimeShort(isoTime: string, timezone: string): string {
  try {
    const date = new Date(isoTime)
    return date.toLocaleString("en-AU", {
      timeZone: timezone === "auto" ? undefined : timezone,
      month: "short",
      day: "numeric",
      hour: "2-digit",
      hour12: false,
    })
  } catch {
    return new Date(isoTime).toLocaleString("en-AU", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      hour12: false,
    })
  }
}
