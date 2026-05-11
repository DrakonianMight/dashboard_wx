export interface WeatherParameter {
  id: string
  name: string
  unit: string
  color: string
  chartType: "line" | "bar"
}

export type WindSpeedUnit = "kmh" | "ms" | "kn"

export const windSpeedUnits: { value: WindSpeedUnit; label: string; symbol: string }[] = [
  { value: "kmh", label: "km/h", symbol: "km/h" },
  { value: "ms", label: "m/s", symbol: "m/s" },
  { value: "kn", label: "Knots", symbol: "kn" },
]

export const weatherParameters: WeatherParameter[] = [
  { id: "temperature_2m", name: "Temperature", unit: "°C", color: "var(--chart-1)", chartType: "line" },
  { id: "relative_humidity_2m", name: "Humidity", unit: "%", color: "var(--chart-2)", chartType: "line" },
  { id: "precipitation", name: "Precipitation", unit: "mm", color: "var(--chart-3)", chartType: "bar" },
  { id: "wind_speed_10m", name: "Wind Speed", unit: "km/h", color: "var(--chart-4)", chartType: "line" },
  { id: "surface_pressure", name: "Pressure", unit: "hPa", color: "var(--chart-5)", chartType: "line" },
]

export interface WeatherModel {
  id: string
  name: string
  description: string
  type: "deterministic" | "ensemble"
  endpoint: "forecast" | "ensemble"
}

export const weatherModels: WeatherModel[] = [
  // Deterministic models
  { 
    id: "ecmwf_ifs025", 
    name: "ECMWF IFS", 
    description: "European Centre - 25km resolution, 15 days", 
    type: "deterministic",
    endpoint: "forecast"
  },
  { 
    id: "ecmwf_aifs025", 
    name: "ECMWF AIFS", 
    description: "ECMWF AI model - 25km resolution, 15 days", 
    type: "deterministic",
    endpoint: "forecast"
  },
  { 
    id: "gfs_seamless", 
    name: "GFS", 
    description: "NOAA Global Forecast System - 25km, 16 days", 
    type: "deterministic",
    endpoint: "forecast"
  },
  { 
    id: "icon_seamless", 
    name: "DWD ICON", 
    description: "German Weather Service - 11km, 7.5 days", 
    type: "deterministic",
    endpoint: "forecast"
  },
  { 
    id: "bom_access_global", 
    name: "BOM ACCESS-G", 
    description: "Australian Bureau of Meteorology - 15km, 10 days", 
    type: "deterministic",
    endpoint: "forecast"
  },
  // Ensemble models
  { 
    id: "ecmwf_ifs025_ensemble", 
    name: "ECMWF IFS Ensemble", 
    description: "51 members - 25km resolution, 15 days", 
    type: "ensemble",
    endpoint: "ensemble"
  },
  { 
    id: "ecmwf_aifs025_ensemble", 
    name: "ECMWF AIFS Ensemble", 
    description: "51 members - AI model, 15 days", 
    type: "ensemble",
    endpoint: "ensemble"
  },
  { 
    id: "gfs_ensemble025", 
    name: "GEFS", 
    description: "31 members - GFS Ensemble 25km, 10 days", 
    type: "ensemble",
    endpoint: "ensemble"
  },
  { 
    id: "icon_eps_global", 
    name: "ICON EPS", 
    description: "40 members - DWD Ensemble, 7.5 days", 
    type: "ensemble",
    endpoint: "ensemble"
  },
]

export type MapStyle = "auto" | "carto-light" | "carto-dark" | "osm"

export const mapStyles: { value: MapStyle; label: string }[] = [
  { value: "auto", label: "Auto (System)" },
  { value: "carto-light", label: "Carto Light" },
  { value: "carto-dark", label: "Carto Dark" },
  { value: "osm", label: "OpenStreetMap" },
]

export interface ForecastData {
  time: string[]
  temperature_2m?: number[]
  relative_humidity_2m?: number[]
  precipitation?: number[]
  wind_speed_10m?: number[]
  surface_pressure?: number[]
}

export interface ModelForecastData {
  modelId: string
  modelName: string
  data: ForecastData
}

export interface ChartDataPoint {
  time: string
  value: number
  type: "forecast" | "observation"
  modelId?: string
  modelName?: string
}

export interface SelectedLocation {
  lat: number
  lng: number
  name?: string
  country?: string
}

export interface Settings {
  temperatureUnit: "celsius" | "fahrenheit"
  windSpeedUnit: WindSpeedUnit
  showCapitals: boolean
  mapStyle: MapStyle
  timezone: string
  selectedModels: string[]
}

export const commonTimezones = [
  { value: "auto", label: "Auto (Location)" },
  { value: "UTC", label: "UTC" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)" },
  { value: "Australia/Darwin", label: "Darwin (ACST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "Mumbai (IST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
]
