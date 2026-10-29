import { useCallback, useEffect, useRef } from 'react'
import Map, { Marker, NavigationControl, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { motion } from 'framer-motion'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

const ESTILO = 'https://tiles.openfreemap.org/styles/positron'
const RECIFE = { latitude: -8.06, longitude: -34.9 }

interface MapaEscolhaProps {
  valor: [number, number] | null
  onEscolher: (pos: [number, number]) => void
  cor: string
}

// Mapa do "Relatar problema": toque para soltar o pino, arraste para ajustar.
export default function MapaEscolha({ valor, onEscolher, cor }: MapaEscolhaProps) {
  const mapRef = useRef<MapRef>(null)

  const aoCarregar = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    for (const camada of ['water', 'waterway']) {
      const l = map.getLayer(camada)
      if (l) map.setPaintProperty(camada, l.type === 'line' ? 'line-color' : 'fill-color', '#9fd3d6')
    }
    if (!map.getLayer('predios-3d')) {
      map.addLayer({
        id: 'predios-3d',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#ece4d0',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.85,
        },
      })
    }
  }, [])

  // Quando o ponto muda por fora (ex: "usar minha localização"), a câmera vai até ele.
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !valor) return
    map.flyTo({ center: [valor[1], valor[0]], zoom: Math.max(map.getZoom(), 16), pitch: 50, duration: 1200 })
  }, [valor])

  return (
    <Map
      ref={mapRef}
      initialViewState={{ ...RECIFE, zoom: 12.3, pitch: 35 }}
      mapStyle={ESTILO}
      onLoad={aoCarregar}
      onClick={(e: MapLayerMouseEvent) => onEscolher([e.lngLat.lat, e.lngLat.lng])}
      cursor="crosshair"
      style={{ width: '100%', height: '100%' }}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="bottom-right" visualizePitch />
      {valor && (
        <Marker
          latitude={valor[0]}
          longitude={valor[1]}
          anchor="bottom"
          draggable
          onDragEnd={(e) => onEscolher([e.lngLat.lat, e.lngLat.lng])}
        >
          <motion.span
            key={`${valor[0]},${valor[1]}`}
            className="relative flex cursor-grab flex-col items-center active:cursor-grabbing"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 16 }}
          >
            <svg viewBox="0 0 32 42" width={36} height={46} aria-hidden>
              <path d="M16 41S3 25.5 3 15.5a13 13 0 0 1 26 0C29 25.5 16 41 16 41Z" fill={cor} stroke="#fff" strokeWidth={3} />
              <circle cx="16" cy="15.5" r="5" fill="#fff" />
            </svg>
            <span className="absolute -bottom-1 h-2 w-5 rounded-full bg-black/25 blur-[2px]" />
          </motion.span>
        </Marker>
      )}
    </Map>
  )
}
