import { Link } from 'react-router-dom'
import type { Post } from '../../../types/database'
import { CATEGORIAS } from '../../../types/database'
import { Card } from '../../../components/ui'

// Tarefa 2.1 do João: componente reutilizável, usado na listagem do Feed.
export default function PostCard({ post }: { post: Post }) {
  const categoriaLabel = CATEGORIAS.find((c) => c.value === post.categoria)?.label ?? post.categoria

  return (
    <Link to={`/feed/${post.id}`}>
      <Card className="hover:border-amarelo-500 transition-colors cursor-pointer h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-amarelo-700">
            {categoriaLabel}
          </span>
          <span className="text-xs text-grafite-500">{post.bairro}</span>
        </div>
        <p className="text-sm text-grafite-900 flex-1">{post.descricao}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-grafite-200">
          <span className="text-xs text-grafite-500">
            {new Date(post.created_at).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-xs font-semibold text-grafite-700">
            Repercussão: {post.repercussao}
          </span>
        </div>
      </Card>
    </Link>
  )
}
