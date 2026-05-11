import { describe, it, expect } from "vitest"
import {
  processChartData,
  processMultiModelChartData,
  aggregatePrecipitationData,
  formatTimeForTimezone,
  formatTimeShort,
} from "../weather-api"
import type { ForecastData, ModelForecastData } from "../weather-types"

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeForecast(overrides: Partial<ForecastData> = {}): ForecastData {
  return {
    time: [
      "2024-06-01T00:00",
      "2024-06-01T01:00",
      "2024-06-01T02:00",
    ],
    temperature_2m: [15, 16, 17],
    precipitation:  [0, 0.5, 1.2],
    ...overrides,
  }
}

function makeModel(id: string, name: string, data: Partial<ForecastData> = {}): ModelForecastData {
  return { modelId: id, modelName: name, data: makeForecast(data) }
}

// ─── processChartData ──────────────────────────────────────────────────────

describe("processChartData", () => {
  it("maps time and value arrays to ChartDataPoints", () => {
    const result = processChartData(makeForecast(), "temperature_2m")
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ time: "2024-06-01T00:00", value: 15, type: "forecast" })
    expect(result[2]).toEqual({ time: "2024-06-01T02:00", value: 17, type: "forecast" })
  })

  it("returns empty array for unknown parameterId", () => {
    expect(processChartData(makeForecast(), "nonexistent_param")).toEqual([])
  })

  it("returns empty array when forecast has no time", () => {
    const noTime = { temperature_2m: [10, 20] } as unknown as ForecastData
    expect(processChartData(noTime, "temperature_2m")).toEqual([])
  })

  it("falls back to 0 for null values in the array", () => {
    const data = makeForecast({ temperature_2m: [10, null as unknown as number, 20] })
    const result = processChartData(data, "temperature_2m")
    expect(result[1].value).toBe(0)
  })
})

// ─── processMultiModelChartData ───────────────────────────────────────────

describe("processMultiModelChartData", () => {
  it("returns empty array when forecasts is empty", () => {
    expect(processMultiModelChartData([], "temperature_2m")).toEqual([])
  })

  it("includes modelId and modelName on each point", () => {
    const result = processMultiModelChartData(
      [makeModel("ecmwf_ifs025", "ECMWF IFS")],
      "temperature_2m",
    )
    expect(result).toHaveLength(3)
    expect(result[0].modelId).toBe("ecmwf_ifs025")
    expect(result[0].modelName).toBe("ECMWF IFS")
  })

  it("preserves full ensemble member IDs (does not strip _member_N)", () => {
    const member = makeModel("ecmwf_ifs025_ensemble_member_1", "ECMWF IFS Ensemble Member 1")
    const result = processMultiModelChartData([member], "temperature_2m")
    expect(result.every(p => p.modelId === "ecmwf_ifs025_ensemble_member_1")).toBe(true)
  })

  it("combines points from multiple models into one flat array", () => {
    const models = [
      makeModel("ecmwf_ifs025", "ECMWF IFS"),
      makeModel("gfs_seamless",  "GFS"),
    ]
    const result = processMultiModelChartData(models, "temperature_2m")
    expect(result).toHaveLength(6)
    expect(result.filter(p => p.modelId === "ecmwf_ifs025")).toHaveLength(3)
    expect(result.filter(p => p.modelId === "gfs_seamless")).toHaveLength(3)
  })

  it("skips models that don't have the requested parameter", () => {
    const models = [
      makeModel("ecmwf_ifs025", "ECMWF IFS"),
      makeModel("gfs_seamless",  "GFS", { temperature_2m: undefined }),
    ]
    const result = processMultiModelChartData(models, "temperature_2m")
    expect(result).toHaveLength(3)
    expect(result.every(p => p.modelId === "ecmwf_ifs025")).toBe(true)
  })
})

// ─── aggregatePrecipitationData ───────────────────────────────────────────

describe("aggregatePrecipitationData", () => {
  it("returns empty array for empty input", () => {
    expect(aggregatePrecipitationData([])).toEqual([])
  })

  it("sums hourly precipitation into 6-hour buckets", () => {
    const forecast = makeForecast({
      time: [
        "2024-06-01T00:00",
        "2024-06-01T01:00",
        "2024-06-01T02:00",
        "2024-06-01T06:00",
        "2024-06-01T07:00",
      ],
      precipitation: [1, 2, 3, 4, 5],
    })
    const result = aggregatePrecipitationData([{ modelId: "m", modelName: "M", data: forecast }])
    // bucket 00:00 = 1+2+3 = 6, bucket 06:00 = 4+5 = 9
    const buckets = Object.fromEntries(result.map(p => [new Date(p.time).getHours(), p.value]))
    expect(buckets[0]).toBe(6)
    expect(buckets[6]).toBe(9)
  })

  it("rounds sums to 1 decimal place", () => {
    const forecast = makeForecast({
      time: ["2024-06-01T00:00", "2024-06-01T01:00"],
      precipitation: [0.15, 0.27],
    })
    const result = aggregatePrecipitationData([{ modelId: "m", modelName: "M", data: forecast }])
    expect(result[0].value).toBe(0.4)
  })

  it("produces separate bucket entries per model", () => {
    const models = [
      makeModel("ecmwf_ifs025", "ECMWF IFS", { precipitation: [1, 2, 3] }),
      makeModel("gfs_seamless",  "GFS",       { precipitation: [4, 5, 6] }),
    ]
    // All 3 hours fall in the 00:00 bucket → 2 models × 1 bucket = 2 points
    const result = aggregatePrecipitationData(models)
    expect(result).toHaveLength(2)
  })

  it("skips forecasts with no precipitation data", () => {
    const model = makeModel("ecmwf_ifs025", "ECMWF IFS", { precipitation: undefined })
    expect(aggregatePrecipitationData([model])).toEqual([])
  })
})

// ─── formatTimeForTimezone / formatTimeShort ──────────────────────────────

describe("formatTimeForTimezone", () => {
  const ISO = "2024-06-15T14:30:00Z"

  it("returns a non-empty string for a valid ISO timestamp", () => {
    const result = formatTimeForTimezone(ISO, "UTC")
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
  })

  it("includes day and hour information", () => {
    const result = formatTimeForTimezone(ISO, "UTC")
    expect(result).toMatch(/15/)   // day
    expect(result).toMatch(/14/)   // hour in UTC
  })

  it("falls back gracefully for invalid timezone string", () => {
    expect(() => formatTimeForTimezone(ISO, "Not/A_Zone")).not.toThrow()
  })
})

describe("formatTimeShort", () => {
  const ISO = "2024-06-15T09:00:00Z"

  it("returns a shorter string than formatTimeForTimezone", () => {
    const short = formatTimeShort(ISO, "UTC")
    const full  = formatTimeForTimezone(ISO, "UTC")
    expect(short.length).toBeLessThanOrEqual(full.length)
  })

  it("falls back gracefully for invalid timezone string", () => {
    expect(() => formatTimeShort(ISO, "Not/A_Zone")).not.toThrow()
  })
})
