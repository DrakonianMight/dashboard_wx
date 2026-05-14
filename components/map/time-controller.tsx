"use client"

import { useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Play, Pause, SkipBack, SkipForward, CloudRain, Satellite, ChevronLeft, ChevronRight } from "lucide-react"
import { useMapTimeStore } from "@/lib/map-time-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface RainViewerResponse {
  radar: {
    past: { time: number; path: string }[]
    nowcast: { time: number; path: string }[]
  }
}

const RADAR_API = "https://api.rainviewer.com/public/weather-maps.json"
const FRAME_INTERVAL_MS = 400

export function TimeController() {
  const {
    radarFrames,
    radarFrameIndex,
    radarPlaying,
    satelliteDate,
    layers,
    setRadarFrames,
    setRadarFrameIndex,
    stepRadarForward,
    stepRadarBackward,
    toggleRadarPlay,
    stepSatelliteDate,
  } = useMapTimeStore()

  useEffect(() => {
    fetch(RADAR_API)
      .then((r) => r.json())
      .then((data: RainViewerResponse) => {
        const frames = [...data.radar.past, ...data.radar.nowcast].map((f) => ({
          timestamp: f.time,
          path: f.path,
        }))
        setRadarFrames(frames)
      })
      .catch(console.error)
  }, [setRadarFrames])

  useEffect(() => {
    if (!radarPlaying || radarFrames.length === 0) return
    let lastTick = 0
    let rafId: number
    const tick = (now: number) => {
      if (now - lastTick >= FRAME_INTERVAL_MS) {
        stepRadarForward()
        lastTick = now
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [radarPlaying, radarFrames.length, stepRadarForward])

  const showRadar     = layers.radar.visible && radarFrames.length > 0
  const showSatellite = layers.satellite.visible

  if (!showRadar && !showSatellite) return null

  const currentFrame = radarFrames[radarFrameIndex]
  const frameDate    = currentFrame ? new Date(currentFrame.timestamp * 1000) : null
  const isNowcast    = currentFrame ? currentFrame.timestamp * 1000 > Date.now() : false

  const isAtLatestSatellite = (() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return satelliteDate >= yesterday.toISOString().split("T")[0]
  })()

  return (
    <div className="absolute bottom-8 left-14 right-4 z-10 pointer-events-none">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-lg pointer-events-auto space-y-2.5">

        {showRadar && frameDate && (
          <div className="flex items-center gap-3">
            <CloudRain className="h-3.5 w-3.5 text-blue-400 shrink-0" />

            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={stepRadarBackward}>
                <SkipBack className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleRadarPlay}>
                {radarPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={stepRadarForward}>
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Slider
              value={[radarFrameIndex]}
              min={0}
              max={radarFrames.length - 1}
              step={1}
              onValueChange={([v]) => setRadarFrameIndex(v)}
              className="flex-1"
            />

            <div className="shrink-0 text-right min-w-[64px]">
              <div className="text-xs font-medium text-foreground tabular-nums">
                {format(frameDate, "EEE HH:mm")}
              </div>
              <div className={`text-[10px] font-medium tabular-nums ${isNowcast ? "text-blue-400" : "text-muted-foreground"}`}>
                {isNowcast ? "NOWCAST" : format(frameDate, "dd MMM")}
              </div>
            </div>
          </div>
        )}

        {showRadar && showSatellite && (
          <div className="border-t border-border" />
        )}

        {showSatellite && (
          <div className="flex items-center gap-3">
            <Satellite className="h-3.5 w-3.5 text-orange-400 shrink-0" />

            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => stepSatelliteDate(-1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => stepSatelliteDate(1)}
                disabled={isAtLatestSatellite}
              >
                <ChevronRight className={`h-3.5 w-3.5 ${isAtLatestSatellite ? "opacity-30" : ""}`} />
              </Button>
            </div>

            <div className="flex-1 text-xs font-medium text-foreground tabular-nums">
              {format(parseISO(satelliteDate), "dd MMM yyyy")}
            </div>

            <div className="shrink-0 text-[10px] font-medium text-muted-foreground">
              DAILY
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
