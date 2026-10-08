import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MOCK_POSTS } from '../mock'
import PostCard from '../components/PostCard'
import MapView from '../../../components/MapView'
import Pills from '../../../components/Pills'
import { Select } from '../../../components/ui'
import { CATEGORIAS, type Categoria } from '../../../types/database'

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
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas')
  const [bairro, setBairro] = useState('')

  const bairros = useMemo(
    () => Array.from(new Set(MOCK_POSTS.map((p) => p.bairro))).sort(),
    [],
  )

  const filtered = useMemo(
    () =>
      MOCK_POSTS.filter(
        (p) => (categoria === 'todas' || p.categoria === categoria) && (!bairro || p.bairro === bairro),
      ),
    [categoria, bairro],
  )

  const pillOptions = [{ value: 'todas' as const, label: 'Todas' }, ...CATEGORIAS]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-grafite-900">Feed</h1>
          <p className="text-sm text-grafite-500">Problemas relatados pela cidade.</p>
        </div>
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

      <div className="space-y-3 mb-6">
        <Pills options={pillOptions} value={categoria} onChange={setCategoria} layoutId="feed-categoria-pill" />
        <Select value={bairro} onChange={(e) => setBairro(e.target.value)} className="max-w-[220px]">
          <option value="">Todos os bairros</option>
          {bairros.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </div>

      <p className="text-xs text-grafite-500 mb-3">
        {filtered.length} {filtered.length === 1 ? 'relato encontrado' : 'relatos encontrados'}
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-grafite-500">Nenhum post encontrado com esses filtros.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Link to="/feed/novo">
        <motion.div
          className="fixed bottom-6 right-6 bg-amarelo-500 text-grafite-900 rounded-full pl-4 pr-5 py-3 shadow-lg flex items-center gap-2 font-semibold text-sm cursor-pointer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-lg leading-none">+</span> Novo relato
        </motion.div>
      </Link>
    </div>
  )
}
