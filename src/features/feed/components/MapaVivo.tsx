import { useCallback, useEffect, useRef, useState } from 'react'
import Map, { NavigationControl, useControl, type MapRef } from 'react-map-gl/maplibre'
import { MapboxOverlay, type MapboxOverlayProps } from '@deck.gl/mapbox'
import { HexagonLayer } from '@deck.gl/aggregation-layers'
import { ScatterplotLayer } from '@deck.gl/layers'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CATEGORIAS, type PostRepercussao } from '../../../types/database'
import { CATEGORIA_RGB, RAMPA_REPERCUSSAO } from '../cores'

// O MapLibre 6 acha o próprio worker relativo ao módulo; o pré-empacotamento
// do Vite muda esse caminho, então apontamos o arquivo explicitamente.
setWorkerUrl(workerUrl)

const ESTILO = 'https://tiles.openfreemap.org/styles/positron'
const RECIFE = { longitude: -34.915, latitude: -8.07 }
const DIA_MS = 86_400_000
const reduzirMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// O tooltip do deck.gl recebe HTML cru — texto de usuário precisa ser escapado.
const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props))
  overlay.setProps(props)
  return null
}

interface MapaVivoProps {
  posts: PostRepercussao[]
  ativoId: string | null
  /** Relato para onde a câmera voa (clique em "ver no mapa"); `seq` permite voar de novo ao mesmo. */
  foco: { id: string; seq: number } | null
  modo3d: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

// Mapa vivo do Feed: base vetorial com prédios em 3D, colunas que sobem do
// chão onde há mais repercussão (soma de recorrência + apoios por área) e
// pinos por categoria — os relatos da última semana pulsam.
export default function MapaVivo({ posts, ativoId, foco, modo3d, onHover, onSelect }: MapaVivoProps) {
  const mapRef = useRef<MapRef>(null)
  const [colunasDePe, setColunasDePe] = useState(false)
  const [pulso, setPulso] = useState(0)

  // Personaliza a base depois que o estilo carrega: rios em destaque e
  // prédios em 3D num tom quente, para casar com o creme da interface.
  const aoCarregar = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    for (const camada of ['water', 'waterway']) {
      if (map.getLayer(camada)) {
        const tipo = map.getLayer(camada)!.type
        map.setPaintProperty(camada, tipo === 'line' ? 'line-color' : 'fill-color', '#9fd3d6')
      }
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
    // No desktop o painel cobre ~440px à esquerda: a câmera compensa para a cidade ficar à vista.
    // No celular é a gaveta que cobre a metade de baixo.
    if (window.matchMedia('(min-width: 1024px)').matches) map.setPadding({ left: 500, top: 0, right: 0, bottom: 0 })
    else map.setPadding({ left: 0, top: 0, right: 0, bottom: Math.round(map.getContainer().clientHeight * 0.5) })
    const voo = reduzirMovimento() ? 0 : 2600
    map.flyTo({ center: [RECIFE.longitude, RECIFE.latitude], zoom: 12.6, pitch: 55, bearing: -18, duration: voo })
    setTimeout(() => setColunasDePe(true), voo * 0.35)
  }, [])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    map.easeTo({ pitch: modo3d ? 55 : 0, bearing: modo3d ? -18 : 0, duration: reduzirMovimento() ? 0 : 900 })
  }, [modo3d])

  useEffect(() => {
    const post = posts.find((p) => p.id === foco?.id)
    const map = mapRef.current?.getMap()
    if (!post || !map) return
    map.flyTo({
      center: [post.longitude, post.latitude],
      zoom: 15.6,
      pitch: modo3d ? 60 : 0,
      duration: reduzirMovimento() ? 0 : 1700,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foco])

  // Relógio do pulso (0 → 1 em loop) para os relatos recentes.
  useEffect(() => {
    if (reduzirMovimento()) return
    let frame = 0
    const inicio = performance.now()
    const tick = (agora: number) => {
      setPulso(((agora - inicio) % 1800) / 1800)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const recentes = posts.filter((p) => Date.now() - new Date(p.created_at).getTime() < 7 * DIA_MS)

  const camadas = [
    new HexagonLayer<PostRepercussao>({
      id: 'colunas-repercussao',
      data: posts,
      getPosition: (p) => [p.longitude, p.latitude],
      getElevationWeight: (p) => p.repercussao + 1,
      elevationAggregation: 'SUM',
      getColorWeight: (p) => p.repercussao + 1,
      colorAggregation: 'SUM',
      colorRange: RAMPA_REPERCUSSAO,
      radius: 380,
      coverage: 0.82,
      extruded: true,
      elevationRange: [0, 900],
      elevationScale: colunasDePe && modo3d ? 1 : 0,
      opacity: 0.78,
      transitions: { elevationScale: { duration: 1600 } },
    }),
    new ScatterplotLayer<PostRepercussao>({
      id: 'pulso-recentes',
      data: recentes,
      getPosition: (p) => [p.longitude, p.latitude],
      radiusUnits: 'pixels',
      getRadius: 7 + pulso * 24,
      getFillColor: (p) => [...CATEGORIA_RGB[p.categoria], Math.round(150 * (1 - pulso))],
      updateTriggers: { getRadius: pulso, getFillColor: pulso },
      parameters: { depthCompare: 'always' },
    }),
    new ScatterplotLayer<PostRepercussao>({
      id: 'pinos',
      data: posts,
      pickable: true,
      getPosition: (p) => [p.longitude, p.latitude],
      radiusUnits: 'pixels',
      getRadius: (p) => (p.id === ativoId ? 12 : 7),
      getFillColor: (p) => CATEGORIA_RGB[p.categoria],
      stroked: true,
      getLineColor: (p) => (p.id === ativoId ? [245, 184, 0] : [255, 255, 255]),
      lineWidthUnits: 'pixels',
      getLineWidth: (p) => (p.id === ativoId ? 4 : 2),
      updateTriggers: { getRadius: ativoId, getLineColor: ativoId, getLineWidth: ativoId },
      transitions: { getRadius: 180 },
      parameters: { depthCompare: 'always' },
      onHover: (info) => onHover((info.object as PostRepercussao | undefined)?.id ?? null),
      onClick: (info) => {
        const post = info.object as PostRepercussao | undefined
        if (post) onSelect(post.id)
      },
    }),
  ]

  return (
    <Map
      ref={mapRef}
      initialViewState={{ ...RECIFE, zoom: 11.2, pitch: 0, bearing: 0 }}
      mapStyle={ESTILO}
      onLoad={aoCarregar}
      cursor={ativoId ? 'pointer' : 'grab'}
      style={{ width: '100%', height: '100%' }}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="bottom-right" visualizePitch style={{ marginBottom: 84, marginRight: 14 }} />
      <DeckOverlay
        layers={camadas}
        getTooltip={({ object }) => {
          const p = object as PostRepercussao | undefined
          if (!p?.descricao) return null
          const cat = CATEGORIAS.find((c) => c.value === p.categoria)?.label ?? p.categoria
          const texto = p.descricao.length > 90 ? `${p.descricao.slice(0, 90)}…` : p.descricao
          return {
            html: `<div style="font:600 11px var(--font-body);letter-spacing:.06em;text-transform:uppercase;color:#6b4e00">${escapar(cat)} · ${escapar(p.bairro)}</div><div style="margin-top:4px;font:500 13px/1.35 var(--font-body)">${escapar(texto)}</div>`,
            style: {
              background: '#fffdf6',
              color: '#1b1813',
              borderRadius: '14px',
              padding: '10px 12px',
              maxWidth: '260px',
              boxShadow: '0 12px 30px rgba(27,24,19,.18)',
              border: '1px solid #f5b800',
            },
          }
        }}
      />
    </Map>
  )
}
