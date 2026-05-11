# Weather Dashboard

A multi-model weather forecasting dashboard built with Next.js, MapLibre GL, and Recharts. Visualises point forecasts from [Open-Meteo](https://open-meteo.com/) with support for deterministic models, ensemble spaghetti plots, and satellite solar observations.

## Features

- **Three forecast themes** — Weather, Renewables, and Maritime, each with a tailored parameter set
- **Multi-model support** — overlay deterministic models (ECMWF IFS, ECMWF AIFS, GFS, DWD ICON) and ensemble members (ECMWF, GEFS, ICON EPS, AIGEFS) as spaghetti plots
- **Maritime** — wave forecasts (height, period, direction, swell) via the Open-Meteo Marine API with ECMWF WAM and GFS Wave models
- **Satellite solar observations** — previous 12 hours of GHI, direct, and diffuse radiation from the Open-Meteo Satellite API, shown alongside the forecast in the Renewables theme
- **Interactive map** — click anywhere or select a city; draggable panel splits map and chart
- **Brush zoom** — zoom into any period on the timeseries; defaults to −12 h → +10 days
- **Unit switching** — temperature (°C / °F), wind speed (km/h, m/s, knots)
- **Dark / light mode** — follows system preference

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

## Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm run start         # Serve production build
npm run lint          # ESLint
npm test              # Run test suite (vitest)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Project structure

```
app/                  Next.js App Router (single route)
components/           React components
  weather-dashboard   State hub — location, settings, SWR fetches
  weather-map         MapLibre GL map with city markers
  weather-chart       Recharts ComposedChart — forecast lines + brush
  model-selector      Floating panel for toggling forecast models
  theme-selector      Weather / Renewables / Maritime switcher
lib/
  weather-api.ts      All Open-Meteo fetch logic + chart data processing
  weather-types.ts    Shared types, model registry, theme definitions
  capitals.ts         Global city coordinates for map markers
```

## API key

The app works without an API key using [Open-Meteo's free tier](https://open-meteo.com/). For higher rate limits, enter a commercial API key in the Settings drawer — it switches all requests to the `customer-*.open-meteo.com` endpoints automatically.

## Data sources

| Data | Provider | Endpoint |
|------|----------|----------|
| NWP forecasts (deterministic + ensemble) | Open-Meteo Forecast API | `api.open-meteo.com/v1/forecast` |
| Wave forecasts | Open-Meteo Marine API | `marine-api.open-meteo.com/v1/marine` |
| Satellite solar observations | Open-Meteo Satellite API | `satellite-api.open-meteo.com/v1/archive` |

## Deployment

```bash
npx vercel   # follow prompts — auto-detects Next.js, no env vars required
```

## Tech stack

- [Next.js 16](https://nextjs.org/) — App Router, TypeScript
- [MapLibre GL](https://maplibre.org/) / [react-map-gl](https://visgl.github.io/react-map-gl/) — interactive map
- [Recharts](https://recharts.org/) — timeseries chart with brush zoom
- [SWR](https://swr.vercel.app/) — data fetching and caching
- [Radix UI](https://www.radix-ui.com/) + [Tailwind CSS v4](https://tailwindcss.com/) — UI components
- [Vitest](https://vitest.dev/) — unit tests
