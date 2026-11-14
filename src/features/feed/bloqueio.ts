import type { Map as MapaLibre } from 'maplibre-gl'
import { LIMITE_RECIFE, LIMITES_CAMERA } from '../../lib/recife'

// "Área bloqueada", como nos jogos de mundo aberto: fora do município do Recife
// o mapa fica escurecido e listrado, e a fronteira da cidade brilha em amarelo.
// O Confluência funciona só dentro da cidade; o resto aparece, mas trancado.

// Retângulo bem maior que a câmera consegue mostrar, com o Recife como buraco.
const MUNDO: [number, number][] = [
  [-36.5, -9.5],
  [-33.5, -9.5],
  [-33.5, -6.5],
  [-36.5, -6.5],
  [-36.5, -9.5],
]

function listras(): { width: number; height: number; data: Uint8ClampedArray } {
  const lado = 22
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = lado
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = 'rgba(253, 251, 244, 0.55)'
  ctx.lineWidth = 3
  // três segmentos para o padrão emendar sem costura
  for (const d of [-lado, 0, lado]) {
    ctx.beginPath()
    ctx.moveTo(d, lado)
    ctx.lineTo(d + lado, 0)
    ctx.stroke()
  }
  return { width: lado, height: lado, data: ctx.getImageData(0, 0, lado, lado).data }
}

/**
 * Deixa o mapa mais leve sem mudar o visual: telas de alta densidade (2x ou
 * mais) desenham 4x os pixels, então limita a 1,5x; e tira os escudos de
 * rodovia (ícones que o MapLibre reposiciona a cada quadro com a câmera inclinada).
 */
export function aliviarMapa(map: MapaLibre) {
  map.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  // Camadas que não servem a uma cidade só: gelo, fronteiras, túneis, rótulos de país e estado.
  const inuteis = /^(landcover_ice|landcover_glacier|boundary|tunnel_|road_area_pier|road_pier|label_country|label_state|railway_.*dashline)|shield|path|waterway_line_label/
  for (const camada of map.getStyle().layers) {
    if (inuteis.test(camada.id)) map.setLayoutProperty(camada.id, 'visibility', 'none')
  }
  // Os prédios 2D só aparecem de longe; de perto o 3D toma o lugar (evita desenhar duas vezes).
  if (map.getLayer('building')) map.setLayerZoomRange('building', 0, 14)
}

/** Escurece e listra tudo fora do Recife e trava a câmera na cidade. */
export function aplicarBloqueio(map: MapaLibre) {
  if (map.getSource('bloqueio')) return
  aliviarMapa(map)
  map.setMaxBounds(LIMITES_CAMERA)
  if (!map.hasImage('listras-bloqueio')) map.addImage('listras-bloqueio', listras())
  map.addSource('bloqueio', {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [MUNDO, ...LIMITE_RECIFE] } },
  })
  // Véu e listras ficam abaixo dos nomes de ruas e bairros (continuam legíveis);
  // só a linha da fronteira vai por cima de tudo.
  const primeiroRotulo = map.getStyle().layers.find((l) => l.type === 'symbol')?.id
  map.addLayer({ id: 'bloqueio-veu', type: 'fill', source: 'bloqueio', paint: { 'fill-color': '#2b2620', 'fill-opacity': 0.42 } }, primeiroRotulo)
  map.addLayer({ id: 'bloqueio-listras', type: 'fill', source: 'bloqueio', paint: { 'fill-pattern': 'listras-bloqueio', 'fill-opacity': 0.55 } }, primeiroRotulo)
  // O mar fica limpo por cima do véu: só a terra fora da cidade parece trancada.
  if (map.getLayer('water')) {
    map.addLayer({
      id: 'mar-limpo',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      filter: ['==', ['get', 'class'], 'ocean'],
      paint: { 'fill-color': map.getPaintProperty('water', 'fill-color') ?? '#9fd3d6' },
    }, primeiroRotulo)
  }
}
