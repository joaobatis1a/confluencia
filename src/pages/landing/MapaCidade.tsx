import { useCallback, useEffect, useRef } from 'react'
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Categoria } from '../../types/database'
import { CATEGORIA_RGB, rgb } from '../../features/feed/cores'

setWorkerUrl(workerUrl)

const ESTILO = 'https://tiles.openfreemap.org/styles/positron'

export interface PontoMapa {
  id: string
  latitude: number
  longitude: number
  categoria: Categoria
}

// O Recife em 3D, girando devagar, com os relatos reais pulsando nas ruas.
// É só cenário (sem interação), para a rolagem da página continuar livre.
export default function MapaCidade({ pontos }: { pontos: PontoMapa[] }) {
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
        minzoom: 13,
        paint: {
          'fill-extrusion-color': '#efe6cf',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.92,
        },
      })
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    let anterior = performance.now()
    const girar = (agora: number) => {
      const map = mapRef.current?.getMap()
      if (map) map.setBearing((map.getBearing() + (agora - anterior) * 0.004) % 360)
      anterior = agora
      frame = requestAnimationFrame(girar)
    }
    frame = requestAnimationFrame(girar)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <Map
      ref={mapRef}
      initialViewState={{ latitude: -8.0605, longitude: -34.8835, zoom: 14.2, pitch: 60, bearing: -18 }}
      mapStyle={ESTILO}
      onLoad={aoCarregar}
      interactive={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      {pontos.map((p) => {
        const cor = rgb(CATEGORIA_RGB[p.categoria])
        return (
          <Marker key={p.id} latitude={p.latitude} longitude={p.longitude} anchor="center">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: cor }} />
              <span className="relative h-4 w-4 rounded-full border-[3px] border-white shadow-lg" style={{ background: cor }} />
            </span>
          </Marker>
        )
      })}
    </Map>
  )
}
