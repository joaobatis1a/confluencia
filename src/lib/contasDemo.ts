// Contas públicas de demonstração (criadas no Supabase do projeto; a de gestor
// é promovida a institucional pelo seed-social-demo.sql). A senha é pública
// de propósito — são contas só para apresentar o sistema.
export const SENHA_DEMO = 'confluencia2026'

export const CONTAS_DEMO = {
  cidada: { email: 'cidada.demo@confluencia.app', nome: 'Marina', papel: 'Cidadã' },
  gestor: { email: 'gestor.demo@confluencia.app', nome: 'Secretaria de Mobilidade', papel: 'Gestor público' },
} as const
