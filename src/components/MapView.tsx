import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { ensureLeafletIcons } from './leafletIcons'

// Centro padrão: Recife (Tarefa 1.2 do João — "teste isolado do mapa Leaflet").
export const RECIFE_CENTER: [number, number] = [-8.05, -34.9]

export interface MapMarkerData {
  id: string
  position: [number, number]
  popupContent?: React.ReactNode
}

interface MapViewProps {
  markers?: MapMarkerData[]
  center?: [number, number]
  zoom?: number
  height?: number | string
  /** Se definido, clicar no mapa chama essa função com [lat, lng] — usado pelo LocationPicker. */
  onMapClick?: (position: [number, number]) => void
  className?: string
}

function ClickHandler({ onMapClick }: { onMapClick?: (position: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

/**
 * Mapa base do Confluência. Usado isolado (Tarefa 1.2 do João) e reaproveitado
 * em LocationPicker (criar post) e nas telas de detalhe de post/projeto.
 */
export default function MapView({
  markers = [],
  center = RECIFE_CENTER,
  zoom = 13,
  height = 320,
  onMapClick,
  className = '',
}: MapViewProps) {
  useEffect(() => {
    ensureLeafletIcons()
  }, [])

  return (
    <div
      className={`rounded-[var(--radius-card)] overflow-hidden border border-grafite-200 ${className}`}
      style={{ height }}
    >
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {markers.map((m) => (
          <Marker key={m.id} position={m.position}>
            {m.popupContent && <Popup>{m.popupContent}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
