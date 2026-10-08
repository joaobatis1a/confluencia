import { MOCK_PROJETOS } from '../mock'
import { Card } from '../../../components/ui'
import StatusBadge from '../../../components/StatusBadge'

// Tarefa 4.2 da Ana (esqueleto na Semana 2, completo na Semana 3): painel de
// gestor — só visível para contas institucionais verificadas (Guilherme,
// Tarefa 3.2). Mostra todos os projetos do órgão, inclusive rejeitados.
export default function PainelGestorPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-grafite-900">Painel de gestor</h1>
        <p className="text-sm text-grafite-500">
          Projetos do seu órgão — inclusive os rejeitados, que não aparecem na visão pública.
        </p>
      </div>
      <div className="space-y-3">
        {MOCK_PROJETOS.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-grafite-900">{p.nome}</p>
              {p.status === 'rejeitado' && (
                <p className="text-xs text-status-vermelho-500 mt-0.5">
                  Rejeitado na consulta pública — não visível ao público
                </p>
              )}
            </div>
            <StatusBadge status={p.status} />
          </Card>
        ))}
      </div>
    </div>
  )
}
