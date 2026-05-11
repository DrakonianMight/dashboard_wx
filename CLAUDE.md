# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js, port 3000)
npm run build    # Production build
npm run lint     # ESLint check
npx tsc --noEmit # TypeScript type check (build ignores TS errors — check manually)
```

There is no test suite. `next.config.mjs` sets `typescript: { ignoreBuildErrors: true }`, so `npm run build` succeeds even with type errors.

## Architecture

Single-page Next.js 16 (App Router) app. The only route is `app/page.tsx` → `<WeatherDashboard>`. There is one API route: `app/api/observations/route.ts`.

**Component tree:**
```
WeatherDashboard        — state hub: location, settings, SWR fetches
  ├── SettingsMenu      — Sheet drawer: units, map style, API key, model/station toggles
  ├── WeatherMap        — react-map-gl/maplibre map; capitals + AUS obs stations as markers
  ├── WeatherChart      — Recharts ComposedChart; forecast lines + obs dots + "Now" ReferenceLine
  └── ModelSelector     — floating card (top-right) for toggling forecast models
```

**Data flow:**
1. User clicks map → `selectedLocation` set in `WeatherDashboard`
2. SWR key array (`[lat, lng, parameterId, timezone, modelIds, windUnit, tempUnit, apiKey]`) triggers `fetchWeatherData` → calls `fetchForecast` in `lib/weather-api.ts`
3. `fetchForecast` routes to `lib/weather-api.ts::fetchFromEndpoint`:
   - Deterministic models → one batched request to `/v1/forecast?models=a,b,c`
   - Ensemble models → **one request PER model** to `/v1/ensemble?models=X` (batching multiple ensemble models returns empty data — Open-Meteo limitation)
4. Observations: `findNearestStation` (haversine, 150 km cutoff) → SWR fetches `/api/observations?station=ID` → server route decompresses meteostat bulk gzip CSV

## Open-Meteo API key facts

- Free base: `https://api.open-meteo.com/v1` / `https://ensemble-api.open-meteo.com/v1`
- Commercial base: `https://customer-api.open-meteo.com/v1` / `https://customer-ensemble-api.open-meteo.com/v1`
- API key appended as `?apikey=...`; presence of key switches to commercial endpoints

**Ensemble response format (critical):**
Single-model ensemble requests return `temperature_2m_member01` … `temperature_2m_member50` with **no model prefix**. Multi-model ensemble requests return empty `hourly` — always make one request per ensemble model. `fetchFromEndpoint` detects members with `/^temperature_2m_member\d+$/`.

Deterministic multi-model response keys: `temperature_2m_ecmwf_ifs025`, `temperature_2m_gfs_seamless`, etc.

## Key files

| File | Purpose |
|------|---------|
| `lib/weather-types.ts` | All shared types + `weatherModels` + `weatherParameters` + `Settings` |
| `lib/weather-api.ts` | All Open-Meteo fetch logic; also `processMultiModelChartData`, `aggregatePrecipitationData`, `formatTimeForTimezone` |
| `lib/stations.ts` | `findNearestStation` (haversine) + `fetchObservations` (calls API route) |
| `lib/aus-stations.json` | 122 Australian Meteostat stations; pre-filtered static file |
| `lib/capitals.ts` | Global city coordinates for map markers |
| `app/api/observations/route.ts` | Server-side: fetches Meteostat bulk CSV gzip, decompresses, parses, filters to last N hours |

## Observations data gap

Meteostat bulk CSV (`bulk.meteostat.net/v2/hourly/{id}.csv.gz`) has a multi-month lag — as of early 2026 the most recent records are from late 2025/early 2026. Filtering to "last 24 hours" always returns empty. This is a known upstream limitation; if real-time obs are needed, the Open-Meteo historical archive API (`/v1/archive`) or a paid Meteostat JSON API would need to replace the bulk endpoint.

## Chart data shape

`ChartDataPoint` objects are keyed by `modelId` in `formattedData` (a time-keyed object built in `weather-chart.tsx`). Ensemble member IDs follow the pattern `{modelId}_member_{N}` (e.g. `ecmwf_ifs025_ensemble_member_1`). `getModelColor` strips the `_member_N` suffix to map ensemble members back to their parent model colour.

## Styling

Tailwind CSS v4 with CSS variables for chart colours (`--chart-1` … `--chart-5`). Dark mode is system-preference-based, detected in `weather-map.tsx` via `matchMedia`. No theme toggle exists; `next-themes` is installed but not wired up.
