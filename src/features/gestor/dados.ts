import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { MOCK_POSTS } from '../feed/mock'
import { MOCK_ORGAO_ID } from '../projetos/mock'
import { buscarResultados, listarProjetosDoOrgao } from '../projetos/api'
import { hojeIso, situacaoDoMarco } from '../projetos/timeline'
import type { PostRepercussao, Projeto, StatusResposta, VotosResultado } from '../../types/database'

// Dados da visão do órgão (Central de relatos, Quadro de projetos e Painel).

export type Fase = 'pendente' | 'andamento' | 'concluido'

/** Onde o relato está para o órgão: sem resposta, em andamento ou encerrado. */
export function faseDoRelato(r: PostRepercussao): Fase {
  if (!r.status_oficial) return 'pendente'
  return r.status_oficial === 'recebido' || r.status_oficial === 'em_analise' ? 'andamento' : 'concluido'
}

export const diasDesde = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)

/** Todos os relatos da cidade (o órgão vê o Feed inteiro), com o status da resposta oficial. */
export function useRelatosGestor() {
  const [relatos, setRelatos] = useState<PostRepercussao[] | null>(null)
  useEffect(() => {
    let cancelado = false
    async function carregar() {
      if (!isSupabaseConfigured) {
        setRelatos(MOCK_POSTS.map((p) => ({ ...p, recorrencia: 0, interacoes: 0, repercussao: p.repercussao ?? 0 })))
        return
      }
      const { data } = await supabase.from('posts_repercussao').select('*').order('created_at', { ascending: false }).limit(500)
      if (!cancelado) setRelatos(data ?? [])
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [])
  // Depois de responder, o relato muda de situação na hora, sem recarregar.
  const definirStatus = useCallback((id: string, status: StatusResposta) => {
    setRelatos((prev) => prev?.map((r) => (r.id === id ? { ...r, status_oficial: status } : r)) ?? prev)
  }, [])
  return { relatos, definirStatus }
}

/** Projetos do órgão logado (inclusive rejeitados) e o resultado das consultas. */
export function useProjetosGestor() {
  const { user } = useAuth()
  const orgaoId = isSupabaseConfigured ? user?.id : MOCK_ORGAO_ID
  const [projetos, setProjetos] = useState<Projeto[] | null>(null)
  const [resultados, setResultados] = useState<Record<string, VotosResultado>>({})
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!orgaoId) return
    let cancelado = false
    listarProjetosDoOrgao(orgaoId)
      .then(async (lista) => {
        const res = await buscarResultados(lista.map((p) => p.id))
        if (cancelado) return
        setProjetos(lista)
        setResultados(res)
      })
      .catch((e) => !cancelado && setErro(e instanceof Error ? e.message : 'erro desconhecido'))
    return () => {
      cancelado = true
    }
  }, [orgaoId])

  const trocar = useCallback((atualizado: Projeto) => {
    setProjetos((prev) => prev?.map((p) => (p.id === atualizado.id ? atualizado : p)) ?? prev)
  }, [])

  return { projetos, resultados, erro, trocar }
}

export function marcosAtrasados(p: Projeto, hoje = hojeIso()) {
  return p.timeline.filter((m) => situacaoDoMarco(m, hoje).situacao === 'atrasado').length
}
