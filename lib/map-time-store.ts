import { create } from "zustand"

export interface RadarFrame {
  timestamp: number
  path: string
}

interface LayerState {
  visible: boolean
  opacity: number
}

function getYesterdayDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split("T")[0]
}

interface MapTimeState {
  radarFrames: RadarFrame[]
  radarFrameIndex: number
  radarPlaying: boolean
  satelliteDate: string
  layers: {
    radar: LayerState
    satellite: LayerState
  }
  setRadarFrames: (frames: RadarFrame[]) => void
  setRadarFrameIndex: (index: number) => void
  stepRadarForward: () => void
  stepRadarBackward: () => void
  toggleRadarPlay: () => void
  setSatelliteDate: (date: string) => void
  stepSatelliteDate: (direction: 1 | -1) => void
  setLayerVisible: (layer: keyof MapTimeState["layers"], visible: boolean) => void
  setLayerOpacity: (layer: keyof MapTimeState["layers"], opacity: number) => void
}

export const useMapTimeStore = create<MapTimeState>((set) => ({
  radarFrames: [],
  radarFrameIndex: 0,
  radarPlaying: true,
  satelliteDate: getYesterdayDate(),
  layers: {
    radar:     { visible: true,  opacity: 0.8 },
    satellite: { visible: false, opacity: 1.0 },
  },
  setRadarFrames: (frames) => set({ radarFrames: frames, radarFrameIndex: frames.length - 1 }),
  setRadarFrameIndex: (index) => set({ radarFrameIndex: index }),
  stepRadarForward: () =>
    set((s) => ({
      radarFrameIndex:
        s.radarFrameIndex >= s.radarFrames.length - 1 ? 0 : s.radarFrameIndex + 1,
    })),
  stepRadarBackward: () =>
    set((s) => ({
      radarFrameIndex:
        s.radarFrameIndex <= 0 ? s.radarFrames.length - 1 : s.radarFrameIndex - 1,
    })),
  toggleRadarPlay: () => set((s) => ({ radarPlaying: !s.radarPlaying })),
  setSatelliteDate: (date) => set({ satelliteDate: date }),
  stepSatelliteDate: (direction) =>
    set((s) => {
      const d = new Date(s.satelliteDate)
      d.setDate(d.getDate() + direction)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(23, 59, 59, 999)
      const limit = new Date()
      limit.setDate(limit.getDate() - 30)
      if (d > yesterday || d < limit) return {}
      return { satelliteDate: d.toISOString().split("T")[0] }
    }),
  setLayerVisible: (layer, visible) =>
    set((s) => ({ layers: { ...s.layers, [layer]: { ...s.layers[layer], visible } } })),
  setLayerOpacity: (layer, opacity) =>
    set((s) => ({ layers: { ...s.layers, [layer]: { ...s.layers[layer], opacity } } })),
}))
