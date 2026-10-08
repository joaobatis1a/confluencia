// Classifica o número de repercussão (Guilherme, Tarefa 2.3: recorrência +
// engajamento) em 3 níveis visuais, usados na barra de repercussão.
// Progressão intencional: neutro → amarelo (chamando atenção) → vermelho
// (urgente) — é o único lugar do produto onde o amarelo marca "ganhando
// atenção" em vez de ação, mas nunca sozinho como "pendência" (ver design
// system: "amarelo não é status de pendência").
export type RepercussaoNivel = 'baixa' | 'media' | 'alta'

const LIMIAR_MEDIA = 10
const LIMIAR_ALTA = 25
// Teto usado só para desenhar a barra (% preenchido) — não é um valor real do produto.
const TETO_BARRA = 40

export function nivelRepercussao(valor: number): RepercussaoNivel {
  if (valor >= LIMIAR_ALTA) return 'alta'
  if (valor >= LIMIAR_MEDIA) return 'media'
  return 'baixa'
}

export function percentualBarra(valor: number): number {
  return Math.min(100, Math.round((valor / TETO_BARRA) * 100))
}

export const REPERCUSSAO_STYLES: Record<RepercussaoNivel, { bar: string; text: string; label: string }> = {
  baixa: { bar: 'bg-grafite-300', text: 'text-grafite-500', label: 'baixa' },
  media: { bar: 'bg-amarelo-500', text: 'text-amarelo-700', label: 'média' },
  alta: { bar: 'bg-status-vermelho-500', text: 'text-status-vermelho-700', label: 'alta' },
}

// "há 3 dias", "há 2 horas" etc. — mesmo padrão usado no protótipo de referência.
export function formatRelativo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const minutos = Math.floor(diffMs / 60_000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  const dias = Math.floor(horas / 24)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}
