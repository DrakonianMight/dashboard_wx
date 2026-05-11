import { describe, it, expect } from "vitest"
import {
  weatherModels,
  weatherThemes,
  windSpeedUnits,
  commonTimezones,
} from "../weather-types"

describe("weatherModels", () => {
  it("every model has a non-empty id, name, description, type, and endpoint", () => {
    for (const m of weatherModels) {
      expect(m.id.length).toBeGreaterThan(0)
      expect(m.name.length).toBeGreaterThan(0)
      expect(m.description.length).toBeGreaterThan(0)
      expect(["deterministic", "ensemble"]).toContain(m.type)
      expect(["forecast", "ensemble", "marine"]).toContain(m.endpoint)
    }
  })

  it("ensemble models use the ensemble endpoint", () => {
    const ensembles = weatherModels.filter(m => m.type === "ensemble")
    expect(ensembles.length).toBeGreaterThan(0)
    for (const m of ensembles) {
      expect(m.endpoint).toBe("ensemble")
    }
  })

  it("marine models use the marine endpoint", () => {
    const marine = weatherModels.filter(m => m.endpoint === "marine")
    expect(marine.length).toBeGreaterThan(0)
    for (const m of marine) {
      expect(m.id).toMatch(/wave|wam/i)
    }
  })

  it("model IDs are unique", () => {
    const ids = weatherModels.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("weatherThemes", () => {
  it("defines weather, renewables, and maritime themes", () => {
    const ids = weatherThemes.map(t => t.id)
    expect(ids).toContain("weather")
    expect(ids).toContain("renewables")
    expect(ids).toContain("maritime")
  })

  it("every theme has at least one parameter", () => {
    for (const theme of weatherThemes) {
      expect(theme.parameters.length).toBeGreaterThan(0)
    }
  })

  it("every parameter has a non-empty id, name, unit, color, and valid chartType", () => {
    for (const theme of weatherThemes) {
      for (const p of theme.parameters) {
        expect(p.id.length).toBeGreaterThan(0)
        expect(p.name.length).toBeGreaterThan(0)
        expect(p.unit.length).toBeGreaterThan(0)
        expect(p.color.length).toBeGreaterThan(0)
        expect(["line", "bar"]).toContain(p.chartType)
      }
    }
  })

  it("renewables theme includes shortwave_radiation", () => {
    const renewables = weatherThemes.find(t => t.id === "renewables")!
    const ids = renewables.parameters.map(p => p.id)
    expect(ids).toContain("shortwave_radiation")
  })

  it("maritime theme includes wave_height", () => {
    const maritime = weatherThemes.find(t => t.id === "maritime")!
    const ids = maritime.parameters.map(p => p.id)
    expect(ids).toContain("wave_height")
  })
})

describe("windSpeedUnits", () => {
  it("includes kmh, ms, and kn", () => {
    const values = windSpeedUnits.map(u => u.value)
    expect(values).toContain("kmh")
    expect(values).toContain("ms")
    expect(values).toContain("kn")
  })

  it("every unit has a label and symbol", () => {
    for (const u of windSpeedUnits) {
      expect(u.label.length).toBeGreaterThan(0)
      expect(u.symbol.length).toBeGreaterThan(0)
    }
  })
})

describe("commonTimezones", () => {
  it("includes UTC and auto", () => {
    const values = commonTimezones.map(t => t.value)
    expect(values).toContain("UTC")
    expect(values).toContain("auto")
  })
})
