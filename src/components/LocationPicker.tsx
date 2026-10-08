import { useState } from 'react'
import MapView, { RECIFE_CENTER } from './MapView'

interface LocationPickerProps {
  value: [number, number] | null
  onChange: (position: [number, number]) => void
}

// Faixa aproximada da Região Metropolitana do Recife — usada na validação
// (Tarefa 3.2 do João: "validação de coordenadas antes de salvar").
const RMR_BOUNDS = { latMin: -8.4, latMax: -7.7, lngMin: -35.3, lngMax: -34.7 }

export function isWithinRecifeMetro([lat, lng]: [number, number]) {
  return (
    lat >= RMR_BOUNDS.latMin &&
    lat <= RMR_BOUNDS.latMax &&
    lng >= RMR_BOUNDS.lngMin &&
    lng <= RMR_BOUNDS.lngMax
  )
}

/**
 * Captura de localização para o formulário de criar post (Tarefa 2.2 do João).
 * Sugere a posição atual via geolocalização do navegador, mas sempre permite
 * ajustar clicando no mapa — o problema relatado pode não ser onde a pessoa está.
 */
export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [geoError, setGeoError] = useState<string | null>(null)

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não disponível neste navegador.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoError(null)
        onChange([pos.coords.latitude, pos.coords.longitude])
      },
      () => setGeoError('Não foi possível obter sua localização. Marque manualmente no mapa.'),
    )
  }

  const outOfBounds = value !== null && !isWithinRecifeMetro(value)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-grafite-900">Localização do problema</span>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="text-sm text-amarelo-700 font-semibold hover:underline"
        >
          Usar minha localização
        </button>
      </div>
      <MapView
        center={value ?? RECIFE_CENTER}
        markers={value ? [{ id: 'picked', position: value }] : []}
        onMapClick={onChange}
        height={260}
      />
      <p className="text-xs text-grafite-500 mt-2">
        {value
          ? `Selecionado: ${value[0].toFixed(5)}, ${value[1].toFixed(5)} — clique no mapa para ajustar.`
          : 'Clique no mapa para marcar onde está o problema.'}
      </p>
      {geoError && <p className="text-xs text-status-vermelho-500 mt-1">{geoError}</p>}
      {outOfBounds && (
        <p className="text-xs text-status-vermelho-500 mt-1">
          Essa coordenada parece estar fora da Região Metropolitana do Recife. Confira o ponto marcado.
        </p>
      )}
    </div>
  )
}
