import { create } from "zustand"

export interface RadarFrame {
  timestamp: number
  path: string
}

interface LayerState {
  visible: boolean
  opacity: number
}

interface MapTimeState {
  radarFrames: RadarFrame[]
  radarFrameIndex: number
  radarPlaying: boolean
  layers: {
    radar: LayerState
  }
  setRadarFrames: (frames: RadarFrame[]) => void
  setRadarFrameIndex: (index: number) => void
  stepRadarForward: () => void
  stepRadarBackward: () => void
  toggleRadarPlay: () => void
  setLayerVisible: (layer: keyof MapTimeState["layers"], visible: boolean) => void
  setLayerOpacity: (layer: keyof MapTimeState["layers"], opacity: number) => void
}

export const useMapTimeStore = create<MapTimeState>((set) => ({
  radarFrames: [],
  radarFrameIndex: 0,
  radarPlaying: false,
  layers: {
    radar: { visible: true, opacity: 0.8 },
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
  setLayerVisible: (layer, visible) =>
    set((s) => ({ layers: { ...s.layers, [layer]: { ...s.layers[layer], visible } } })),
  setLayerOpacity: (layer, opacity) =>
    set((s) => ({ layers: { ...s.layers, [layer]: { ...s.layers[layer], opacity } } })),
}))
