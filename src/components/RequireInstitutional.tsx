import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card } from './ui'

/**
 * Protege /painel — só quem tem profiles.institucional_verificado = true
 * pode ver. Isso é a checagem no frontend (UX: mensagem clara em vez de tela
 * vazia); a proteção que realmente importa é o RLS no banco
 * (supabase/migrations/0004_rls_policies.sql), que bloqueia a leitura/escrita
 * mesmo que alguém pule essa tela.
 */
export default function RequireInstitutional({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="max-w-md mx-auto px-4 py-16 text-sm text-grafite-500">Carregando...</div>
  }

  if (!user || !profile?.institucional_verificado) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <p className="text-sm text-grafite-900 font-medium mb-1">Acesso restrito</p>
          <p className="text-sm text-grafite-500">
            O painel de gestor é visível só para contas institucionais verificadas. Se você representa
            um órgão público, peça a verificação da sua conta (feita manualmente pelo time, ver Tarefa
            3.2 do Guilherme).
          </p>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
