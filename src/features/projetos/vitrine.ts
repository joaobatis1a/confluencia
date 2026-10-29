import { MOCK_PROJETOS } from './mock'
import { buscarProjeto, listarProjetosPublicos } from './api'
import type { Projeto } from '../../types/database'

// Os projetos de exemplo (p1…p6) têm foto, proposta e galeria, e não existem no
// banco. Com o Supabase ligado, a listagem mostra os projetos reais (via api.ts)
// e, depois deles, esses exemplos, para a demonstração não ficar vazia.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const ehExemplo = (id: string) => !UUID.test(id)

export async function carregarProjetosPublicos(): Promise<Projeto[]> {
  const doBanco = await listarProjetosPublicos()
  const ids = new Set(doBanco.map((p) => p.id))
  return [...doBanco, ...MOCK_PROJETOS.filter((p) => p.status !== 'rejeitado' && !ids.has(p.id))]
}

/** Exemplo da vitrine pelo id, ou o projeto do banco (null se não existir ou se for rejeitado de outro órgão). */
export async function carregarProjeto(id: string): Promise<Projeto | null> {
  const exemplo = MOCK_PROJETOS.find((p) => p.id === id)
  if (exemplo || ehExemplo(id)) return exemplo ?? null
  return buscarProjeto(id)
}
