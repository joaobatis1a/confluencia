// Corrige um problema clássico do react-leaflet + bundlers (Vite incluso):
// os ícones padrão do marcador não aparecem porque o Leaflet tenta carregar
// os PNGs por um caminho relativo que o bundler não resolve sozinho.
// Isso precisa rodar uma vez, antes de qualquer <MapContainer /> ser montado.
import L from 'leaflet'
import marker from 'leaflet/dist/images/marker-icon.png'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let patched = false

export function ensureLeafletIcons() {
  if (patched) return
  patched = true
  // @ts-expect-error -- método interno do Leaflet, é o fix recomendado pela própria documentação
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: marker,
    iconRetinaUrl: marker2x,
    shadowUrl: markerShadow,
  })
}
