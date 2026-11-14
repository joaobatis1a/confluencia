import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { MOCK_PROJETOS, MOCK_ORGAO_ID, MOCK_RESULTADOS } from './mock'
import type { MarcoTimeline, Projeto, ProjetoStatus, VotosResultado } from '../../types/database'

// Tarefas 3.1 / 3.2 / 3.3 da Ana: todas as consultas do módulo Projetos num lugar só.
// As telas não falam com o Supabase diretamente — chamam estas funções. Assim:
//  - com Supabase configurado, tudo é real (tabelas/funções da migration 0007);
//  - sem Supabase (.env.local vazio), as MESMAS funções usam os dados mock, e a
//    demonstração continua funcionando (votar, publicar atualização etc.).

const SEM_VOTOS = (projetoId: string): VotosResultado => ({
  projeto_id: projetoId,
  votos_favor: 0,
  votos_contra: 0,
  total_votos: 0,
})

// ---------------------------------------------------------------------------
// Leitura de projetos
// ---------------------------------------------------------------------------

/** Listagem pública: nunca inclui projetos rejeitados (só o painel do órgão mostra). */
export async function listarProjetosPublicos(): Promise<Projeto[]> {
  if (!isSupabaseConfigured) return MOCK_PROJETOS.filter((p) => p.status !== 'rejeitado')
  const { data, error } = await supabase
    .from('projetos')
    .select('*')
    .neq('status', 'rejeitado')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Detalhe de um projeto. Retorna null se não existir OU se for rejeitado e quem
 * pede não é o órgão dono (o RLS da 0007 devolve vazio nesses casos — para o
 * público, "rejeitado" e "não existe" são a mesma coisa).
 */
export async function buscarProjeto(id: string): Promise<Projeto | null> {
  if (!isSupabaseConfigured) return MOCK_PROJETOS.find((p) => p.id === id) ?? null
  const { data, error } = await supabase.from('projetos').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/** Painel de gestor: todos os projetos do órgão, inclusive rejeitados. */
export async function listarProjetosDoOrgao(orgaoId: string): Promise<Projeto[]> {
  if (!isSupabaseConfigured) return MOCK_PROJETOS.filter((p) => p.orgao_id === MOCK_ORGAO_ID)
  const { data, error } = await supabase
    .from('projetos')
    .select('*')
    .eq('orgao_id', orgaoId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Votação (Tarefa 3.3)
// ---------------------------------------------------------------------------

/** Resultado agregado de um projeto. Sem linha na view = ninguém votou ainda = 0/0/0. */
export async function buscarResultado(projetoId: string): Promise<VotosResultado> {
  if (!isSupabaseConfigured) return { ...(MOCK_RESULTADOS[projetoId] ?? SEM_VOTOS(projetoId)) }
  const { data, error } = await supabase
    .from('votos_resultado')
    .select('*')
    .eq('projeto_id', projetoId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ?? SEM_VOTOS(projetoId)
}

/** Resultados de vários projetos de uma vez (painel de gestor), indexados por projeto. */
export async function buscarResultados(projetoIds: string[]): Promise<Record<string, VotosResultado>> {
  if (projetoIds.length === 0) return {}
  if (!isSupabaseConfigured) {
    return Object.fromEntries(projetoIds.map((id) => [id, { ...(MOCK_RESULTADOS[id] ?? SEM_VOTOS(id)) }]))
  }
  const { data, error } = await supabase.from('votos_resultado').select('*').in('projeto_id', projetoIds)
  if (error) throw new Error(error.message)
  const porProjeto = Object.fromEntries((data ?? []).map((r) => [r.projeto_id, r]))
  return Object.fromEntries(projetoIds.map((id) => [id, porProjeto[id] ?? SEM_VOTOS(id)]))
}

// Comprovantes do modo demonstração (só em memória; somem ao recarregar a página).
const mockComprovantes = new Map<string, string>()

/**
 * Comprovante do usuário neste projeto, ou null se ainda não votou. É assim que a
 * tela sabe "já votou" ao abrir/recarregar. Nunca devolve a opção escolhida.
 */
export async function buscarMeuComprovante(projetoId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return mockComprovantes.get(projetoId) ?? null
  const { data, error } = await supabase.rpc('meu_comprovante', { p_projeto_id: projetoId })
  if (error) throw new Error(error.message)
  return data ?? null
}

export type MotivoFalhaVoto = 'ja_votou' | 'sem_login' | 'fora_da_consulta' | 'consulta_encerrada' | 'orgao' | 'erro'

export type ResultadoVoto =
  | { ok: true; comprovante: string }
  | { ok: false; motivo: MotivoFalhaVoto; mensagem: string }

/**
 * Registra o voto chamando a função `votar` do banco, que valida login, status e
 * prazo, bloqueia voto duplicado (UNIQUE) e GERA o hash do comprovante.
 * Códigos de erro: 23505 = já votou · CF001 = projeto fora de consulta ·
 * CF002 = prazo encerrado · CF003 = conta de órgão (0013) · 28000 = sem login (ver 0007_votacao_projetos.sql).
 */
export async function votar(projetoId: string, opcao: 'favor' | 'contra'): Promise<ResultadoVoto> {
  if (!isSupabaseConfigured) {
    if (mockComprovantes.has(projetoId)) {
      return { ok: false, motivo: 'ja_votou', mensagem: 'Você já votou neste projeto.' }
    }
    const hash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    mockComprovantes.set(projetoId, hash)
    const atual = MOCK_RESULTADOS[projetoId] ?? SEM_VOTOS(projetoId)
    MOCK_RESULTADOS[projetoId] = {
      projeto_id: projetoId,
      votos_favor: atual.votos_favor + (opcao === 'favor' ? 1 : 0),
      votos_contra: atual.votos_contra + (opcao === 'contra' ? 1 : 0),
      total_votos: atual.total_votos + 1,
    }
    return { ok: true, comprovante: hash }
  }

  const { data, error } = await supabase.rpc('votar', { p_projeto_id: projetoId, p_opcao: opcao })
  if (!error && data) return { ok: true, comprovante: data }

  const codigo = error?.code
  if (codigo === '23505') {
    return { ok: false, motivo: 'ja_votou', mensagem: 'Você já votou neste projeto.' }
  }
  if (codigo === '28000') {
    return { ok: false, motivo: 'sem_login', mensagem: 'Entre com sua conta para votar.' }
  }
  if (codigo === 'CF001') {
    return { ok: false, motivo: 'fora_da_consulta', mensagem: 'Este projeto não está em consulta pública.' }
  }
  if (codigo === 'CF002') {
    return { ok: false, motivo: 'consulta_encerrada', mensagem: 'A consulta pública deste projeto já foi encerrada.' }
  }
  if (codigo === 'CF003') {
    return { ok: false, motivo: 'orgao', mensagem: 'Contas de órgão público acompanham o resultado, mas não votam.' }
  }
  return {
    ok: false,
    motivo: 'erro',
    mensagem: `Não foi possível registrar o voto: ${error?.message ?? 'resposta vazia do servidor'}`,
  }
}

/** Auditoria: confere se um comprovante existe (devolve só o projeto e a data, nunca o votante). */
export async function verificarComprovante(
  hash: string,
): Promise<{ projeto_id: string; created_at: string } | null> {
  const limpo = hash.trim().toLowerCase()
  if (limpo.length < 16) return null
  if (!isSupabaseConfigured) {
    for (const [projetoId, h] of mockComprovantes) {
      if (h.startsWith(limpo)) return { projeto_id: projetoId, created_at: new Date().toISOString() }
    }
    return null
  }
  const { data, error } = await supabase.rpc('verificar_comprovante', { p_hash: limpo })
  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}

// ---------------------------------------------------------------------------
// Gestão do projeto (Tarefa 3.2): publicar atualização
// ---------------------------------------------------------------------------

/** Mudanças de status que o órgão pode fazer a partir de cada status. */
export const PROXIMOS_STATUS: Record<ProjetoStatus, ProjetoStatus[]> = {
  proposto: ['em_consulta'],
  em_consulta: ['aprovado', 'rejeitado'],
  aprovado: ['em_execucao'],
  rejeitado: [],
  em_execucao: ['concluido'],
  concluido: [],
}

/** Uma atualização publicada pelo órgão (histórico do projeto, migration 0016). */
export interface AtualizacaoHistorico {
  id: string
  projeto_id: string
  texto: string | null
  foto_url: string | null
  status_de: ProjetoStatus | null
  status_para: ProjetoStatus | null
  marco_nome: string | null
  marco_data: string | null
  created_at: string
}

/** O que a atualização muda. Pelo menos um dos campos, ou o texto. */
export interface NovaAtualizacao {
  marco?: number
  dataReal?: string
  novoStatus?: ProjetoStatus
  consultaFim?: string
  texto?: string
  fotoUrl?: string | null
}

// Histórico do modo demonstração (some ao recarregar).
const MOCK_HISTORICO: AtualizacaoHistorico[] = []

export async function listarAtualizacoes(projetoId: string): Promise<AtualizacaoHistorico[]> {
  if (!isSupabaseConfigured) return MOCK_HISTORICO.filter((a) => a.projeto_id === projetoId)
  const { data, error } = await supabase.from('projeto_atualizacoes').select('*').eq('projeto_id', projetoId).order('created_at', { ascending: false })
  // Antes da 0016 a tabela não existe: sem histórico, sem erro na tela.
  if (error) return []
  return (data ?? []) as AtualizacaoHistorico[]
}

const MENSAGENS_BANCO: Record<string, string> = {
  CF020: '',
  CF021: '',
  '42501': 'Você não tem permissão para atualizar este projeto.',
  '28000': 'Entre com a conta do órgão para publicar.',
}

/**
 * Publica uma atualização pelo servidor (publicar_atualizacao, 0016): ele confere
 * dono, etapa permitida, marco e prazo, e grava o histórico. Se a migration ainda
 * não foi aplicada, cai no jeito antigo (update direto) para o sistema não parar.
 */
export async function publicarAtualizacao(projeto: Projeto, a: NovaAtualizacao): Promise<Projeto> {
  if (!isSupabaseConfigured) {
    const atual = MOCK_PROJETOS.find((p) => p.id === projeto.id)
    if (!atual) throw new Error('Projeto não encontrado.')
    const de = atual.status
    if (a.marco !== undefined) atual.timeline = atual.timeline.map((m, i) => (i === a.marco ? { ...m, data_real: a.dataReal ?? null } : m))
    if (a.novoStatus) atual.status = a.novoStatus
    if (a.consultaFim) atual.consulta_fim = a.consultaFim
    MOCK_HISTORICO.unshift({
      id: crypto.randomUUID(),
      projeto_id: atual.id,
      texto: a.texto?.trim() || null,
      foto_url: a.fotoUrl ?? null,
      status_de: a.novoStatus && a.novoStatus !== de ? de : null,
      status_para: a.novoStatus && a.novoStatus !== de ? a.novoStatus : null,
      marco_nome: a.marco !== undefined ? (projeto.timeline[a.marco]?.nome ?? null) : null,
      marco_data: a.dataReal ?? null,
      created_at: new Date().toISOString(),
    })
    return { ...atual }
  }
  const { data, error } = await supabase.rpc('publicar_atualizacao', {
    p_projeto_id: projeto.id,
    p_marco: a.marco ?? null,
    p_data_real: a.dataReal ?? null,
    p_novo_status: a.novoStatus ?? null,
    p_consulta_fim: a.consultaFim ?? null,
    p_texto: a.texto?.trim() || null,
    p_foto_url: a.fotoUrl ?? null,
  })
  if (error) {
    if (error.code === 'PGRST202' || /publicar_atualizacao/.test(error.message) && /not find|does not exist/i.test(error.message)) {
      // Migration 0016 ainda não aplicada: jeito antigo, sem histórico.
      const mudancas: AtualizacaoProjeto = {}
      if (a.marco !== undefined) mudancas.timeline = projeto.timeline.map((m, i) => (i === a.marco ? { ...m, data_real: a.dataReal ?? null } : m))
      if (a.novoStatus) mudancas.status = a.novoStatus
      if (a.consultaFim) mudancas.consulta_fim = a.consultaFim
      return atualizarProjeto(projeto.id, mudancas)
    }
    throw new Error(MENSAGENS_BANCO[error.code ?? ''] || error.message)
  }
  return data as Projeto
}

export interface AtualizacaoProjeto {
  status?: ProjetoStatus
  timeline?: MarcoTimeline[]
  consulta_fim?: string | null
}

/**
 * Publica uma atualização: mudar o status e/ou marcar marcos como concluídos.
 * Só o órgão dono consegue (RLS "projetos: so o orgao dono edita" + GRANT por
 * coluna da 0007 — o dono não consegue trocar orgao_id nem outras colunas).
 * Devolve o projeto já atualizado.
 */
export async function atualizarProjeto(id: string, mudancas: AtualizacaoProjeto): Promise<Projeto> {
  if (!isSupabaseConfigured) {
    const projeto = MOCK_PROJETOS.find((p) => p.id === id)
    if (!projeto) throw new Error('Projeto não encontrado.')
    Object.assign(projeto, mudancas)
    return { ...projeto }
  }
  const { data, error } = await supabase.from('projetos').update(mudancas).eq('id', id).select().maybeSingle()
  if (error) throw new Error(error.message)
  // Update que o RLS bloqueia não dá erro: só afeta 0 linhas. Tratamos como falha.
  if (!data) throw new Error('Você não tem permissão para atualizar este projeto.')
  return data
}
