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

// ─── Themes ────────────────────────────────────────────────────────────────

export type ThemeId = "weather" | "renewables" | "maritime" | "risk"

export interface WeatherTheme {
  id: ThemeId
  name: string
  parameters: WeatherParameter[]
  apiType: "forecast" | "marine"
}

const weatherParameters: WeatherParameter[] = [
  { id: "temperature_2m",      name: "Temperature",   unit: "°C",   color: "var(--chart-1)", chartType: "line" },
  { id: "apparent_temperature",name: "Feels Like",    unit: "°C",   color: "hsl(15,80%,55%)", chartType: "line" },
  { id: "dew_point_2m",        name: "Dew Point",     unit: "°C",   color: "hsl(190,70%,50%)", chartType: "line" },
  { id: "relative_humidity_2m",name: "Humidity",      unit: "%",    color: "var(--chart-2)", chartType: "line" },
  { id: "precipitation",       name: "Precipitation", unit: "mm",   color: "var(--chart-3)", chartType: "bar" },
  { id: "wind_speed_10m",      name: "Wind 10m",      unit: "km/h", color: "var(--chart-4)", chartType: "line" },
  { id: "wind_speed_80m",      name: "Wind 80m",      unit: "km/h", color: "hsl(260,60%,60%)", chartType: "line" },
  { id: "wind_speed_120m",     name: "Wind 120m",     unit: "km/h", color: "hsl(280,60%,55%)", chartType: "line" },
  { id: "surface_pressure",    name: "Pressure",      unit: "hPa",  color: "var(--chart-5)", chartType: "line" },
]

const renewablesParameters: WeatherParameter[] = [
  { id: "shortwave_radiation", name: "Solar GHI",      unit: "W/m²", color: "hsl(45,95%,55%)", chartType: "line" },
  { id: "direct_radiation",    name: "Direct Solar",   unit: "W/m²", color: "hsl(35,90%,50%)", chartType: "line" },
  { id: "diffuse_radiation",   name: "Diffuse Solar",  unit: "W/m²", color: "hsl(55,85%,55%)", chartType: "line" },
  { id: "wind_speed_10m",      name: "Wind 10m",       unit: "km/h", color: "var(--chart-4)", chartType: "line" },
  { id: "wind_speed_80m",      name: "Wind 80m",       unit: "km/h", color: "hsl(260,60%,60%)", chartType: "line" },
  { id: "wind_speed_120m",     name: "Wind 120m",      unit: "km/h", color: "hsl(280,60%,55%)", chartType: "line" },
  { id: "wind_speed_180m",     name: "Wind 180m",      unit: "km/h", color: "hsl(300,60%,55%)", chartType: "line" },
  { id: "temperature_2m",      name: "Temperature",    unit: "°C",   color: "var(--chart-1)", chartType: "line" },
]

const maritimeParameters: WeatherParameter[] = [
  { id: "wave_height",          name: "Wave Height",     unit: "m",  color: "hsl(210,80%,55%)", chartType: "line" },
  { id: "wave_period",          name: "Wave Period",     unit: "s",  color: "hsl(200,70%,45%)", chartType: "line" },
  { id: "wave_direction",       name: "Wave Direction",  unit: "°",  color: "hsl(190,65%,50%)", chartType: "line" },
  { id: "swell_wave_height",    name: "Swell Height",    unit: "m",  color: "hsl(230,70%,60%)", chartType: "line" },
  { id: "swell_wave_period",    name: "Swell Period",    unit: "s",  color: "hsl(220,65%,55%)", chartType: "line" },
  { id: "swell_wave_direction", name: "Swell Direction", unit: "°",  color: "hsl(240,65%,60%)", chartType: "line" },
  { id: "wind_wave_height",     name: "Wind Wave Height",unit: "m",  color: "hsl(180,70%,45%)", chartType: "line" },
  { id: "wind_speed_10m",       name: "Wind 10m",        unit: "km/h",color: "var(--chart-4)", chartType: "line" },
  { id: "wind_speed_80m",       name: "Wind 80m",        unit: "km/h",color: "hsl(260,60%,60%)", chartType: "line" },
]

const riskParameters: WeatherParameter[] = [
  { id: "temperature_2m",       name: "Temperature",   unit: "°C",   color: "var(--chart-1)", chartType: "line" },
  { id: "relative_humidity_2m", name: "Humidity",      unit: "%",    color: "var(--chart-2)", chartType: "line" },
  { id: "precipitation",        name: "Precipitation", unit: "mm",   color: "var(--chart-3)", chartType: "bar" },
  { id: "wind_speed_10m",       name: "Wind 10m",      unit: "km/h", color: "var(--chart-4)", chartType: "line" },
  { id: "wind_speed_80m",       name: "Wind 80m",      unit: "km/h", color: "hsl(260,60%,60%)", chartType: "line" },
  { id: "wind_speed_120m",      name: "Wind 120m",     unit: "km/h", color: "hsl(280,60%,55%)", chartType: "line" },
  { id: "surface_pressure",     name: "Pressure",      unit: "hPa",  color: "var(--chart-5)", chartType: "line" },
]

export const weatherThemes: WeatherTheme[] = [
  { id: "weather",    name: "Weather",    parameters: weatherParameters,    apiType: "forecast" },
  { id: "renewables", name: "Renewables", parameters: renewablesParameters, apiType: "forecast" },
  { id: "maritime",   name: "Maritime",   parameters: maritimeParameters,   apiType: "marine" },
  { id: "risk",       name: "Risk",       parameters: riskParameters,       apiType: "forecast" },
]

// Re-export the weather parameters array so existing code doesn't break
export { weatherParameters }

// ─── Models ────────────────────────────────────────────────────────────────

export interface WeatherModel {
  id: string
  name: string
  description: string
  type: "deterministic" | "ensemble"
  endpoint: "forecast" | "ensemble" | "marine"
}

export const weatherModels: WeatherModel[] = [
  // Deterministic NWP
  { id: "ecmwf_ifs025",           name: "ECMWF IFS",           description: "European Centre - 25km resolution, 15 days", type: "deterministic", endpoint: "forecast" },
  { id: "ecmwf_aifs025",          name: "ECMWF AIFS",          description: "ECMWF AI model - 25km resolution, 15 days",  type: "deterministic", endpoint: "forecast" },
  { id: "gfs_seamless",           name: "GFS",                  description: "NOAA Global Forecast System - 25km, 16 days",type: "deterministic", endpoint: "forecast" },
  { id: "icon_seamless",          name: "DWD ICON",             description: "German Weather Service - 11km, 7.5 days",    type: "deterministic", endpoint: "forecast" },
  // Ensemble NWP
  { id: "ecmwf_ifs025_ensemble",  name: "ECMWF IFS Ensemble",  description: "51 members - 25km resolution, 15 days",      type: "ensemble",      endpoint: "ensemble" },
  { id: "ecmwf_aifs025_ensemble", name: "ECMWF AIFS Ensemble", description: "51 members - AI model, 15 days",             type: "ensemble",      endpoint: "ensemble" },
  { id: "gfs_ensemble025",        name: "GEFS",                 description: "31 members - GFS Ensemble 25km, 10 days",   type: "ensemble",      endpoint: "ensemble" },
  { id: "icon_eps_global",        name: "ICON EPS",             description: "40 members - DWD Ensemble, 7.5 days",       type: "ensemble",      endpoint: "ensemble" },
  { id: "ncep_aigefs025",         name: "AIGEFS",               description: "NCEP AI Global Ensemble - 25km resolution", type: "ensemble",      endpoint: "ensemble" },
  // Wave models (marine API)
  { id: "ecmwf_wam025",           name: "ECMWF WAM",           description: "ECMWF Wave Action Model - 0.25°, 10 days",  type: "deterministic", endpoint: "marine" },
  { id: "gfs_wave025",            name: "GFS Wave",             description: "NOAA GFS Wave Model - 0.25°, 10 days",     type: "deterministic", endpoint: "marine" },
]

export type MapStyle = "auto" | "carto-light" | "carto-dark" | "osm"

export const mapStyles: { value: MapStyle; label: string }[] = [
  { value: "auto",        label: "Auto (System)" },
  { value: "carto-light", label: "Carto Light" },
  { value: "carto-dark",  label: "Carto Dark" },
  { value: "osm",         label: "OpenStreetMap" },
]

// ─── Data shapes ───────────────────────────────────────────────────────────

export interface ForecastData {
  time: string[]
  // Weather
  temperature_2m?: number[]
  apparent_temperature?: number[]
  dew_point_2m?: number[]
  relative_humidity_2m?: number[]
  precipitation?: number[]
  wind_speed_10m?: number[]
  wind_speed_80m?: number[]
  wind_speed_120m?: number[]
  wind_speed_180m?: number[]
  shortwave_radiation?: number[]
  direct_radiation?: number[]
  diffuse_radiation?: number[]
  surface_pressure?: number[]
  // Marine
  wave_height?: number[]
  wave_direction?: number[]
  wave_period?: number[]
  swell_wave_height?: number[]
  swell_wave_direction?: number[]
  swell_wave_period?: number[]
  wind_wave_height?: number[]
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

export interface ObservationStation {
  id: string
  name: string
  lat: number
  lng: number
  elevation: number | null
  hourlyEnd: string
  distanceKm?: number
}

export interface HourlyObservation {
  time: string
  temperature?: number
  humidity?: number
  precipitation?: number
  windSpeed?: number
  pressure?: number
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
  apiKey?: string
}

export const commonTimezones = [
  { value: "auto",                  label: "Auto (Location)" },
  { value: "UTC",                   label: "UTC" },
  { value: "Australia/Sydney",      label: "Sydney (AEST/AEDT)" },
  { value: "Australia/Melbourne",   label: "Melbourne (AEST/AEDT)" },
  { value: "Australia/Brisbane",    label: "Brisbane (AEST)" },
  { value: "Australia/Perth",       label: "Perth (AWST)" },
  { value: "Australia/Adelaide",    label: "Adelaide (ACST/ACDT)" },
  { value: "Australia/Darwin",      label: "Darwin (ACST)" },
  { value: "Pacific/Auckland",      label: "Auckland (NZST/NZDT)" },
  { value: "Asia/Tokyo",            label: "Tokyo (JST)" },
  { value: "Asia/Singapore",        label: "Singapore (SGT)" },
  { value: "Asia/Shanghai",         label: "Shanghai (CST)" },
  { value: "Asia/Kolkata",          label: "Mumbai (IST)" },
  { value: "Europe/London",         label: "London (GMT/BST)" },
  { value: "Europe/Paris",          label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin",         label: "Berlin (CET/CEST)" },
  { value: "America/New_York",      label: "New York (EST/EDT)" },
  { value: "America/Chicago",       label: "Chicago (CST/CDT)" },
  { value: "America/Denver",        label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles",   label: "Los Angeles (PST/PDT)" },
]
