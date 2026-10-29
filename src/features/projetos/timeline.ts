import type { MarcoTimeline } from '../../types/database'

// Tarefa 3.1 da Ana, passo 1: "marcos com data prevista e real, com indicação de
// atraso/cumprido". Lógica pura (sem React) para ficar fácil de testar.

export type SituacaoMarco = 'cumprido' | 'cumprido_atraso' | 'atrasado' | 'pendente'

export interface InfoMarco {
  situacao: SituacaoMarco
  /** dias de atraso (só em 'cumprido_atraso' e 'atrasado'); 0 nos demais */
  diasAtraso: number
}

const MS_DIA = 24 * 60 * 60 * 1000

/** Dia do calendário (sem hora, sem fuso) de 'YYYY-MM-DD' ou de um ISO — em "número de dias". */
function numeroDoDia(data: string): number {
  const [ano, mes, dia] = data.slice(0, 10).split('-').map(Number)
  return Date.UTC(ano, mes - 1, dia) / MS_DIA
}

/** Data de hoje no fuso de quem está usando, no formato 'YYYY-MM-DD'. */
export function hojeIso(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function situacaoDoMarco(marco: MarcoTimeline, hoje: string): InfoMarco {
  const prevista = numeroDoDia(marco.data_prevista)
  if (marco.data_real) {
    const atraso = numeroDoDia(marco.data_real) - prevista
    return atraso > 0
      ? { situacao: 'cumprido_atraso', diasAtraso: atraso }
      : { situacao: 'cumprido', diasAtraso: 0 }
  }
  const atraso = numeroDoDia(hoje) - prevista
  return atraso > 0 ? { situacao: 'atrasado', diasAtraso: atraso } : { situacao: 'pendente', diasAtraso: 0 }
}

const plural = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`

export function rotuloDaSituacao({ situacao, diasAtraso }: InfoMarco): string {
  switch (situacao) {
    case 'cumprido':
      return 'Cumprido no prazo'
    case 'cumprido_atraso':
      return `Cumprido com ${plural(diasAtraso)} de atraso`
    case 'atrasado':
      return `Atrasado há ${plural(diasAtraso)}`
    case 'pendente':
      return 'Previsto'
  }
}

/** Resumo para o topo da timeline: "2 de 4 marcos cumpridos · 1 atrasado". */
export function resumoDaTimeline(marcos: MarcoTimeline[], hoje: string): string {
  const infos = marcos.map((m) => situacaoDoMarco(m, hoje))
  const cumpridos = infos.filter((i) => i.situacao === 'cumprido' || i.situacao === 'cumprido_atraso').length
  const atrasados = infos.filter((i) => i.situacao === 'atrasado').length
  const base = `${cumpridos} de ${marcos.length} ${marcos.length === 1 ? 'marco cumprido' : 'marcos cumpridos'}`
  if (atrasados === 0) return base
  return `${base} · ${atrasados} ${atrasados === 1 ? 'atrasado' : 'atrasados'}`
}
