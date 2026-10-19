import type { Projeto, ProjetoStatus } from '../../types/database'

// Etapas públicas do trilho de um projeto. "Rejeitado" fica fora da visão
// pública (só no painel do órgão).
export const ETAPAS_PUBLICAS: { status: ProjetoStatus; label: string }[] = [
  { status: 'proposto', label: 'Proposto' },
  { status: 'em_consulta', label: 'Consulta' },
  { status: 'aprovado', label: 'Aprovado' },
  { status: 'em_execucao', label: 'Execução' },
  { status: 'concluido', label: 'Concluído' },
]

export const indiceEtapa = (status: ProjetoStatus) => ETAPAS_PUBLICAS.findIndex((e) => e.status === status)

const DIA_MS = 86_400_000

/** Dias inteiros até o fim da consulta (0 = termina hoje), ou null se não houver prazo. */
export function diasRestantes(projeto: Projeto, agora: number): number | null {
  if (!projeto.consulta_fim) return null
  return Math.max(0, Math.ceil((new Date(projeto.consulta_fim).getTime() - agora) / DIA_MS))
}

/** Marcos da linha do tempo já cumpridos (com data_real). */
export function marcosCumpridos(projeto: Projeto) {
  return projeto.timeline.filter((m) => m.data_real).length
}

export function proximoMarco(projeto: Projeto) {
  return projeto.timeline.find((m) => !m.data_real) ?? null
}
