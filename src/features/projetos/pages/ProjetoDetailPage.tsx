import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MOCK_PROJETOS } from '../mock'
import { Button, Card } from '../../../components/ui'
import StatusBadge from '../../../components/StatusBadge'

// Tarefa 3.1 da Ana (Semana 3): tela completa com timeline + votação.
// A votação aqui é só a interface (UI) — o registro real do voto com hash e
// bloqueio de duplicidade é a Tarefa 3.1 do Guilherme (RLS na tabela `votos`,
// ver supabase/migrations/0004_rls_policies.sql), que ainda não existe num
// projeto Supabase real. Por isso o "comprovante" abaixo é só visual, gerado
// no navegador, não persiste em lugar nenhum ainda.
export default function ProjetoDetailPage() {
  const { id } = useParams()
  const projeto = MOCK_PROJETOS.find((p) => p.id === id)
  const [voto, setVoto] = useState<'favor' | 'contra' | null>(null)
  const [comprovante, setComprovante] = useState<string | null>(null)

  if (!projeto) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-grafite-500">Projeto não encontrado.</p>
        <Link to="/projetos" className="text-amarelo-700 font-semibold text-sm hover:underline">
          Voltar aos Projetos
        </Link>
      </div>
    )
  }

  const projetoId = projeto.id

  function votar(opcao: 'favor' | 'contra') {
    setVoto(opcao)
    // placeholder visual — o hash real é gerado no banco (ver Tarefa 3.1 do Guilherme)
    setComprovante(btoa(`${projetoId}:${Date.now()}`).slice(0, 16))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/projetos" className="text-sm text-grafite-500 hover:underline">
        ← Voltar aos Projetos
      </Link>

      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="font-heading text-xl font-bold text-grafite-900">{projeto.nome}</h1>
          <StatusBadge status={projeto.status} />
        </div>
        <p className="text-sm text-grafite-700">{projeto.descricao}</p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-heading text-sm font-bold text-grafite-900 mb-3">Linha do tempo</h2>
        <ol className="space-y-3">
          {projeto.timeline.map((marco, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                  marco.data_real ? 'bg-status-verde-500' : 'bg-grafite-300'
                }`}
              />
              <div className="flex-1">
                <span className="font-medium text-grafite-900">{marco.nome}</span>
                <span className="text-grafite-500 ml-2">
                  previsto {new Date(marco.data_prevista).toLocaleDateString('pt-BR')}
                  {marco.data_real &&
                    ` · concluído ${new Date(marco.data_real).toLocaleDateString('pt-BR')}`}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {projeto.status === 'em_consulta' && (
        <Card className="mt-4">
          <h2 className="font-heading text-sm font-bold text-grafite-900 mb-1">Consulta pública</h2>
          <p className="text-xs text-grafite-500 mb-4">
            Seu voto é secreto (nunca vinculado ao seu nome publicamente) e consultivo — não obriga a
            decisão final do governo, mas gera um registro oficial de opinião.
          </p>
          {voto ? (
            <div className="rounded-[var(--radius-field)] bg-status-verde-50 p-3 text-sm text-status-verde-700">
              Voto registrado: <b>{voto === 'favor' ? 'a favor' : 'contra'}</b>.
              <br />
              Comprovante: <code className="text-xs">{comprovante}</code>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button onClick={() => votar('favor')} className="flex-1">
                Votar a favor
              </Button>
              <Button variant="secondary" onClick={() => votar('contra')} className="flex-1">
                Votar contra
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
