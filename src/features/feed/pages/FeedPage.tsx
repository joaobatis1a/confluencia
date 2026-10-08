import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_POSTS } from '../mock'
import PostCard from '../components/PostCard'
import MapView from '../../../components/MapView'
import { Button, Select } from '../../../components/ui'
import { CATEGORIAS } from '../../../types/database'

// Tarefa 2.5 do João: "listagem real + filtro por categoria/bairro".
// --- PRÓXIMO PASSO (fora do escopo desta entrega, pendente de Supabase real) ---
// Troque MOCK_POSTS por uma query real assim que a tabela `posts` existir:
//
//   const { data, error } = await supabase
//     .from('posts')
//     .select('*')
//     .order('created_at', { ascending: false })
//
// O resto da tela (filtros, cards, mapa) já funciona igual com dados reais,
// porque o formato de `Post` é o mesmo (ver src/types/database.ts).
export default function FeedPage() {
  const [categoria, setCategoria] = useState('')
  const [bairro, setBairro] = useState('')

  const bairros = useMemo(
    () => Array.from(new Set(MOCK_POSTS.map((p) => p.bairro))).sort(),
    [],
  )

  const filtered = useMemo(
    () =>
      MOCK_POSTS.filter(
        (p) => (!categoria || p.categoria === categoria) && (!bairro || p.bairro === bairro),
      ),
    [categoria, bairro],
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-grafite-900">Feed</h1>
          <p className="text-sm text-grafite-500">Problemas relatados pela cidade.</p>
        </div>
        <Link to="/feed/novo">
          <Button>Relatar problema</Button>
        </Link>
      </div>

      <MapView
        className="mb-6"
        markers={filtered.map((p) => ({
          id: p.id,
          position: [p.latitude, p.longitude],
          popupContent: (
            <div className="text-xs">
              <b>{p.bairro}</b>
              <br />
              {p.descricao.slice(0, 60)}...
            </div>
          ),
        }))}
      />

      <div className="flex gap-3 mb-6">
        <Select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="max-w-[220px]">
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select value={bairro} onChange={(e) => setBairro(e.target.value)} className="max-w-[220px]">
          <option value="">Todos os bairros</option>
          {bairros.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-grafite-500">Nenhum post encontrado com esses filtros.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
