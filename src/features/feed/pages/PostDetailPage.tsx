import { Link, useParams } from 'react-router-dom'
import { MOCK_POSTS } from '../mock'
import MapView from '../../../components/MapView'
import { Card } from '../../../components/ui'
import { CATEGORIAS } from '../../../types/database'

// Tarefa 4.1 do João (Semana 4): camada de simulação visual — versão ilustrativa,
// ainda estática por enquanto (igual combinado no Escopo Geral: não é preditivo).
export default function PostDetailPage() {
  const { id } = useParams()
  const post = MOCK_POSTS.find((p) => p.id === id)

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-grafite-500">Post não encontrado.</p>
        <Link to="/feed" className="text-amarelo-700 font-semibold text-sm hover:underline">
          Voltar ao Feed
        </Link>
      </div>
    )
  }

  const categoriaLabel = CATEGORIAS.find((c) => c.value === post.categoria)?.label ?? post.categoria

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/feed" className="text-sm text-grafite-500 hover:underline">
        ← Voltar ao Feed
      </Link>
      <Card className="mt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-amarelo-700">
          {categoriaLabel}
        </span>
        <h1 className="font-heading text-xl font-bold text-grafite-900 mt-1 mb-3">{post.bairro}</h1>
        <p className="text-sm text-grafite-900 mb-4">{post.descricao}</p>
        <MapView
          markers={[{ id: post.id, position: [post.latitude, post.longitude] }]}
          center={[post.latitude, post.longitude]}
          zoom={15}
          height={240}
        />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-grafite-200 text-xs text-grafite-500">
          <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
          <span className="font-semibold text-grafite-700">Repercussão: {post.repercussao}</span>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-heading text-sm font-bold text-grafite-900 mb-2">
          Simulação de impacto (ilustrativa)
        </h2>
        <p className="text-xs text-grafite-500 mb-3">
          Representação visual do que a resolução deste problema pode significar para a região — não é
          um cálculo preditivo real (fora do escopo do MVP, ver Escopo Geral).
        </p>
        <div className="grid grid-cols-2 gap-3 text-center text-xs font-semibold text-grafite-700">
          <div className="rounded-[var(--radius-field)] bg-grafite-200 h-24 flex items-center justify-center">
            Situação atual
          </div>
          <div className="rounded-[var(--radius-field)] bg-status-verde-50 h-24 flex items-center justify-center text-status-verde-700">
            Situação prevista
          </div>
        </div>
      </Card>
    </div>
  )
}
