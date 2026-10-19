import type { Categoria } from '../../types/database'

// Cor de cada categoria no mapa 3D (RGB, formato do deck.gl).
export const CATEGORIA_RGB: Record<Categoria, [number, number, number]> = {
  mobilidade: [46, 95, 207],
  iluminacao: [224, 122, 20],
  seguranca: [214, 59, 47],
  saneamento: [22, 138, 156],
  pracas_lazer: [30, 138, 76],
  saude: [190, 40, 110],
  educacao: [100, 65, 200],
  outros: [110, 108, 100],
}

export const rgb = ([r, g, b]: [number, number, number]) => `rgb(${r}, ${g}, ${b})`

// Rampa das colunas de repercussão: do amarelo da marca ao vermelho de alerta.
export const RAMPA_REPERCUSSAO: [number, number, number][] = [
  [255, 243, 196],
  [255, 221, 117],
  [245, 184, 0],
  [236, 140, 30],
  [220, 90, 40],
  [185, 45, 35],
]
