import { useCallback, useEffect, useRef } from 'react'
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

const ESTILO = 'https://tiles.openfreemap.org/styles/positron'

interface MapaOrbitaProps {
  latitude: number
  longitude: number
  cor: string
}

// Mapa do detalhe do relato: câmera inclinada girando devagar em volta do
// ponto relatado, com prédios em 3D. Para de girar quando a pessoa mexe.
export default function MapaOrbita({ latitude, longitude, cor }: MapaOrbitaProps) {
  const mapRef = useRef<MapRef>(null)
  const girando = useRef(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)

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
          'fill-extrusion-opacity': 0.9,
        },
      })
    }
    map.on('dragstart', () => (girando.current = false))
    map.on('wheel', () => (girando.current = false))
  }, [])

  useEffect(() => {
    let frame = 0
    let anterior = performance.now()
    const girar = (agora: number) => {
      const map = mapRef.current?.getMap()
      if (map && girando.current) map.setBearing((map.getBearing() + (agora - anterior) * 0.006) % 360)
      anterior = agora
      frame = requestAnimationFrame(girar)
    }
    frame = requestAnimationFrame(girar)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <Map
      ref={mapRef}
      initialViewState={{ latitude, longitude, zoom: 16.4, pitch: 62, bearing: -20 }}
      mapStyle={ESTILO}
      onLoad={aoCarregar}
      style={{ width: '100%', height: '100%' }}
      attributionControl={{ compact: true }}
      scrollZoom={false}
    >
      <Marker latitude={latitude} longitude={longitude} anchor="center">
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: cor }} />
          <span className="absolute -inset-3 animate-pulse rounded-full opacity-25" style={{ background: cor }} />
          <span className="relative h-5 w-5 rounded-full border-[3px] border-white shadow-lg" style={{ background: cor }} />
        </span>
      </Marker>
    </Map>
  )
}
