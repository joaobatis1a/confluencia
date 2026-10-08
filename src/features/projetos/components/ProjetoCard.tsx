import { Link } from 'react-router-dom'
import type { Projeto } from '../../../types/database'
import { Card } from '../../../components/ui'
import StatusBadge from '../../../components/StatusBadge'

// Tarefa 2.1 da Ana: componente reutilizável, usado na listagem de Projetos.
export default function ProjetoCard({ projeto }: { projeto: Projeto }) {
  return (
    <Link to={`/projetos/${projeto.id}`}>
      <Card className="hover:border-amarelo-500 transition-colors cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading font-semibold text-grafite-900 text-sm">{projeto.nome}</h3>
        </div>
        <p className="text-sm text-grafite-700 flex-1">{projeto.descricao}</p>
        <div className="mt-3 pt-3 border-t border-grafite-200">
          <StatusBadge status={projeto.status} />
        </div>
      </Card>
    </Link>
  )
}
