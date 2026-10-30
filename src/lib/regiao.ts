// Validação de coordenadas antes de salvar um relato (Tarefa 3.2 do João):
// o ponto precisa cair na Região Metropolitana do Recife (retângulo aproximado).
const RMR_BOUNDS = { latMin: -8.4, latMax: -7.7, lngMin: -35.3, lngMax: -34.7 }

export function isWithinRecifeMetro([lat, lng]: [number, number]) {
  return lat >= RMR_BOUNDS.latMin && lat <= RMR_BOUNDS.latMax && lng >= RMR_BOUNDS.lngMin && lng <= RMR_BOUNDS.lngMax
}
