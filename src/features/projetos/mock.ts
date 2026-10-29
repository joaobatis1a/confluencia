import type { Projeto, VotosResultado } from '../../types/database'

// Dados mock — Tarefa 2.1 da Ana ("telas estáticas, projetos inventados").
// Só são usados quando o Supabase NÃO está configurado (modo demonstração) —
// com o banco real, as consultas em ./api.ts leem as tabelas de verdade.

/** "Órgão" fictício dono de todos os projetos mock (o painel de gestor mostra os dele). */
export const MOCK_ORGAO_ID = 'mock-orgao-1'

export const MOCK_PROJETOS: Projeto[] = [
  {
    id: 'p1',
    orgao_id: 'mock-orgao-1',
    nome: 'Requalificação da Av. Norte',
    descricao: 'Nova ciclovia, iluminação de LED e recapeamento em 3km de extensão.',
    categoria: 'mobilidade',
    status: 'em_consulta',
    origem_post_id: null,
    timeline: [
      { nome: 'Projeto técnico', data_prevista: '2026-09-01', data_real: '2026-09-03' },
      { nome: 'Licitação', data_prevista: '2026-11-01', data_real: null },
      { nome: 'Início da obra', data_prevista: '2027-01-15', data_real: null },
    ],
    consulta_fim: '2026-11-20T23:59:59Z',
    created_at: '2026-08-20T10:00:00Z',
  },
  {
    id: 'p2',
    orgao_id: 'mock-orgao-1',
    nome: 'Revitalização da Praça do Derby',
    descricao: 'Novos brinquedos, poda de árvores e academia ao ar livre.',
    categoria: 'pracas_lazer',
    status: 'em_execucao',
    origem_post_id: '4',
    timeline: [
      { nome: 'Projeto técnico', data_prevista: '2026-06-01', data_real: '2026-06-05' },
      { nome: 'Licitação', data_prevista: '2026-07-01', data_real: '2026-07-10' },
      { nome: 'Início da obra', data_prevista: '2026-08-01', data_real: '2026-08-02' },
      { nome: 'Entrega', data_prevista: '2026-10-10', data_real: null },
    ],
    consulta_fim: null,
    created_at: '2026-05-10T10:00:00Z',
  },
  {
    id: 'p3',
    orgao_id: 'mock-orgao-1',
    nome: 'Nova UPA em Várzea',
    descricao: 'Unidade de pronto atendimento com 24h de funcionamento.',
    categoria: 'saude',
    status: 'rejeitado',
    origem_post_id: null,
    timeline: [{ nome: 'Projeto técnico', data_prevista: '2026-04-01', data_real: '2026-04-01' }],
    consulta_fim: '2026-05-01T23:59:59Z',
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'p4',
    orgao_id: 'mock-orgao-1',
    nome: 'Drenagem da Rua das Flores',
    descricao: 'Obra de drenagem para resolver alagamentos recorrentes.',
    categoria: 'saneamento',
    status: 'concluido',
    origem_post_id: '3',
    timeline: [
      { nome: 'Projeto técnico', data_prevista: '2026-01-01', data_real: '2026-01-01' },
      { nome: 'Obra', data_prevista: '2026-03-01', data_real: '2026-03-20' },
    ],
    consulta_fim: null,
    created_at: '2025-12-01T10:00:00Z',
  },
  // Exemplo de projeto aprovado nascido de um relato real do Feed (conta demo de cidadã).
  {
    id: 'p5',
    orgao_id: 'mock-orgao-1',
    nome: 'Iluminação em LED na Rua da Aurora',
    descricao: 'Troca de 42 luminárias por LED e reforço da iluminação junto à Ponte Duarte Coelho.',
    categoria: 'iluminacao',
    status: 'aprovado',
    origem_post_id: 'f18d0028-15e5-49f4-9502-aae82917731d',
    timeline: [
      { nome: 'Projeto técnico', data_prevista: '2026-09-15', data_real: '2026-09-12' },
      { nome: 'Consulta pública', data_prevista: '2026-10-05', data_real: '2026-10-05' },
      { nome: 'Licitação', data_prevista: '2026-11-20', data_real: null },
      { nome: 'Instalação', data_prevista: '2027-01-30', data_real: null },
    ],
    consulta_fim: '2026-10-05T23:59:59Z',
    created_at: '2026-09-01T10:00:00Z',
  },
  // Exemplo de projeto concluído com antes/depois do mesmo lugar (Rua dos Judeus, 1855 → Rua do Bom Jesus).
  {
    id: 'p6',
    orgao_id: 'mock-orgao-1',
    nome: 'Requalificação da Rua do Bom Jesus',
    descricao: 'Restauro das fachadas, calçamento em pedra e rua aberta a pedestres no Recife Antigo.',
    categoria: 'pracas_lazer',
    status: 'concluido',
    origem_post_id: null,
    timeline: [
      { nome: 'Projeto técnico', data_prevista: '2025-03-01', data_real: '2025-03-10' },
      { nome: 'Consulta pública', data_prevista: '2025-05-01', data_real: '2025-05-01' },
      { nome: 'Obra', data_prevista: '2025-12-15', data_real: '2026-02-02' },
      { nome: 'Entrega', data_prevista: '2026-02-20', data_real: '2026-02-28' },
    ],
    consulta_fim: '2025-05-01T23:59:59Z',
    created_at: '2025-02-01T10:00:00Z',
  },
]

// Resultado agregado de demonstração (o que a view `votos_resultado` devolveria).
// Mutável de propósito: no modo demonstração, votar soma aqui.
export const MOCK_RESULTADOS: Record<string, VotosResultado> = {
  p1: { projeto_id: 'p1', votos_favor: 892, votos_contra: 348, total_votos: 1240 },
  p2: { projeto_id: 'p2', votos_favor: 1530, votos_contra: 210, total_votos: 1740 },
  p3: { projeto_id: 'p3', votos_favor: 130, votos_contra: 610, total_votos: 740 },
  p4: { projeto_id: 'p4', votos_favor: 980, votos_contra: 60, total_votos: 1040 },
}
