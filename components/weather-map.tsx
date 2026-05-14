"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import Map, { Marker, NavigationControl, Source, Layer, MapRef, MapMouseEvent } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"
import { capitals, Capital } from "@/lib/capitals"
import { SelectedLocation, Settings, MapStyle } from "@/lib/weather-types"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import { useMapTimeStore } from "@/lib/map-time-store"
import { TimeController } from "@/components/map/time-controller"
import { LayerManager } from "@/components/map/layer-manager"

interface WeatherMapProps {
  selectedLocation: SelectedLocation | null
  onLocationSelect: (location: SelectedLocation) => void
  settings: Settings
}

function getMapStyleUrl(mapStyle: MapStyle, isDarkMode: boolean): string {
  switch (mapStyle) {
    case "carto-light":
      return "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    case "carto-dark":
      return "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    case "osm":
      return "https://tiles.openfreemap.org/styles/liberty"
    case "auto":
    default:
      return isDarkMode
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
  }
}

export function WeatherMap({ selectedLocation, onLocationSelect, settings }: WeatherMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null)
  const [introDismissed, setIntroDismissed] = useState(false)
  const { radarFrames, radarFrameIndex, layers } = useMapTimeStore()

  const currentRadarFrame = radarFrames[radarFrameIndex]
  const radarTileUrl = currentRadarFrame
    ? `https://tilecache.rainviewer.com${currentRadarFrame.path}/256/{z}/{x}/{y}/2/1_1.png`
    : null

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDarkMode(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  const mapStyle = getMapStyleUrl(settings.mapStyle, isDarkMode)

  const handleMapClick = useCallback((event: MapMouseEvent) => {
    const { lngLat } = event
    onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng })
  }, [onLocationSelect])

  const handleMapMouseMove = useCallback((event: MapMouseEvent) => {
    const { lngLat, point } = event
    setHoverCoords({ lat: lngLat.lat, lng: lngLat.lng, x: point.x, y: point.y })
  }, [])

  const handleMapMouseLeave = useCallback(() => {
    setHoverCoords(null)
  }, [])

  const handleCapitalClick = useCallback((capital: Capital) => {
    onLocationSelect({ lat: capital.lat, lng: capital.lng, name: capital.name, country: capital.country })
    mapRef.current?.flyTo({ center: [capital.lng, capital.lat], zoom: 6, duration: 1000 })
  }, [onLocationSelect])

  return (
    <div className="relative h-full w-full" onClick={() => setIntroDismissed(true)}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 134.0, latitude: -25.0, zoom: 3.5 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        cursor="crosshair"
      >
        <NavigationControl position="bottom-left" />

        {settings.showCapitals && capitals.map((capital) => (
          <Marker
            key={`${capital.name}-${capital.country}`}
            longitude={capital.lng}
            latitude={capital.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              handleCapitalClick(capital)
            }}
          >
            <div className="flex flex-col items-center cursor-pointer group">
              <span className="text-[10px] font-medium text-foreground bg-background/80 px-1 rounded shadow-sm mb-0.5 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
                {capital.name}
              </span>
              <div
                className={`
                  w-2 h-2 rounded-full transition-all duration-200
                  ${selectedLocation?.name === capital.name
                    ? "bg-primary scale-150 ring-2 ring-primary/50"
                    : "bg-primary/80 group-hover:bg-primary group-hover:scale-125"
                  }
                `}
              />
            </div>
          </Marker>
        ))}

        {selectedLocation && !selectedLocation.name && (
          <Marker longitude={selectedLocation.lng} latitude={selectedLocation.lat} anchor="center">
            <div className="w-4 h-4 rounded-full bg-accent ring-2 ring-accent/50 animate-pulse" />
          </Marker>
        )}

        {layers.radar.visible && radarTileUrl && (
          <Source
            id="radar"
            type="raster"
            tiles={[radarTileUrl]}
            tileSize={256}
            attribution="© RainViewer"
          >
            <Layer
              id="radar-layer"
              type="raster"
              paint={{ "raster-opacity": layers.radar.opacity }}
            />
          </Source>
        )}
      </Map>

      <LayerManager />
      <TimeController />

      {hoverCoords && (
        <div
          className="absolute pointer-events-none bg-card/90 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs text-muted-foreground shadow-md z-10"
          style={{ left: hoverCoords.x + 12, top: hoverCoords.y + 12 }}
        >
          {hoverCoords.lat.toFixed(4)}, {hoverCoords.lng.toFixed(4)}
        </div>
      )}

      {!introDismissed && !selectedLocation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Card className="pointer-events-auto bg-card/95 backdrop-blur-sm border-border shadow-lg max-w-sm mx-4 relative">
            <button
              className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={(e) => { e.stopPropagation(); setIntroDismissed(true) }}
            >
              <X className="h-4 w-4" />
            </button>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a Location</h3>
              <p className="text-sm text-muted-foreground">
                Click anywhere on the map or select a city to view weather forecasts for that location.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedLocation && (
        <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">
            {selectedLocation.name || "Custom Location"}
          </p>
          {selectedLocation.country && (
            <p className="text-xs text-muted-foreground">{selectedLocation.country}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  )
}
