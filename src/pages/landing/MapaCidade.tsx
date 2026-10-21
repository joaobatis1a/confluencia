import { useEffect, useRef, useState } from 'react'
import Map, { type MapRef } from 'react-map-gl/maplibre'
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

interface Foto {
  url: string
  pinos: { id: string; x: number; y: number; cor: string }[]
}

// O Recife em 3D, com os relatos reais pulsando nas ruas — só cenário.
//
// Para não pesar: o mapa 3D é desenhado UMA vez, vira imagem e é desligado
// (o contexto WebGL é liberado). Daí em diante o topo é uma <img> com os pinos
// por cima, e o movimento de câmera é CSS, que roda no compositor.
export default function MapaCidade({ pontos, carregou }: { pontos: PontoMapa[]; carregou: boolean }) {
  const mapRef = useRef<MapRef>(null)
  const [ocioso, setOcioso] = useState(false)
  const [foto, setFoto] = useState<Foto | null>(null)

  function aoCarregar() {
    const map = mapRef.current?.getMap()
    if (!map) return
    for (const camada of ['water', 'waterway']) {
      const l = map.getLayer(camada)
      if (l) map.setPaintProperty(camada, l.type === 'line' ? 'line-color' : 'fill-color', '#9fd3d6')
    }
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
    // "idle" = estilo, blocos e prédios todos desenhados.
    map.once('idle', () => setOcioso(true))
  }

  // Tira a foto quando o mapa terminou de desenhar e os relatos já chegaram.
  useEffect(() => {
    if (!ocioso || !carregou || foto) return
    const map = mapRef.current?.getMap()
    if (!map) return
    const tela = map.getCanvas()
    const { width, height } = tela.getBoundingClientRect()
    setFoto({
      url: tela.toDataURL('image/jpeg', 0.86),
      pinos: pontos.map((p) => {
        const { x, y } = map.project([p.longitude, p.latitude])
        return { id: p.id, x: (x / width) * 100, y: (y / height) * 100, cor: rgb(CATEGORIA_RGB[p.categoria]) }
      }),
    })
  }, [ocioso, carregou, foto, pontos])

  return (
    <div className="relative h-full w-full">
      {!foto && (
        <Map
          ref={mapRef}
          initialViewState={{ latitude: -8.0605, longitude: -34.8835, zoom: 14.2, pitch: 60, bearing: -18 }}
          mapStyle={ESTILO}
          onLoad={aoCarregar}
          interactive={false}
          attributionControl={false}
          canvasContextAttributes={{ preserveDrawingBuffer: true }}
          pixelRatio={Math.min(window.devicePixelRatio, 1.5)}
          fadeDuration={0}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {foto && (
        <div
          className="anima-continua absolute inset-0 will-change-transform"
          style={{ animation: 'deriva-camera 38s ease-in-out infinite alternate' }}
        >
          <img src={foto.url} alt="Mapa 3D do centro do Recife" className="h-full w-full object-cover" />
          {foto.pinos.map((p) => (
            <span
              key={p.id}
              className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: p.cor }} />
              <span className="relative h-4 w-4 rounded-full border-[3px] border-white shadow-lg" style={{ background: p.cor }} />
            </span>
          ))}
        </div>
      )}
      <span className="pointer-events-auto absolute bottom-1.5 right-2 z-10 text-[10px] text-grafite-500/80">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> ·{' '}
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>
      </span>
    </div>
  )
}
