import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CATEGORIAS, type PostRepercussao } from '../../../types/database'
import IconeCategoria from './IconeCategoria'
import { realcar } from '../busca'

interface EmAltaCardProps {
  post: PostRepercussao
  ativo: boolean
  onHover: (id: string | null) => void
  onVerNoMapa: (id: string) => void
  busca?: string
}

// Destaque do topo da lista: o relato com maior repercussão no filtro atual.
export default function EmAltaCard({ post, ativo, onHover, onVerNoMapa, busca = '' }: EmAltaCardProps) {
  const categoria = CATEGORIAS.find((c) => c.value === post.categoria)?.label ?? post.categoria

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: ativo ? -3 : 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      onMouseEnter={() => onHover(post.id)}
      onMouseLeave={() => onHover(null)}
      className="group relative overflow-hidden rounded-[24px] bg-amarelo-500 text-grafite-900 shadow-[0_20px_40px_-18px_rgba(184,134,11,0.9)]"
    >
      {/* Faixas diagonais que correm devagar: "está acontecendo agora". */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-10 opacity-[0.13]"
        style={{
          backgroundImage: 'repeating-linear-gradient(115deg, #1b1813 0 2px, transparent 2px 22px)',
        }}
        animate={{ x: [0, 44] }}
        transition={{ duration: 3.5, ease: 'linear', repeat: Infinity }}
      />

      <Link to={`/feed/${post.id}`} className="relative block p-5 pr-16" onFocus={() => onHover(post.id)}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-grafite-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-amarelo-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amarelo-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amarelo-300" />
          </span>
          Em alta
        </span>

        <span className="mt-3 flex items-center gap-2 text-xs font-semibold">
          <IconeCategoria categoria={post.categoria} size={16} />
          {categoria} · {post.bairro}
        </span>
        <span className="mt-1.5 block font-heading text-lg font-bold leading-snug line-clamp-3">{realcar(post.descricao, busca)}</span>

        <span className="mt-4 flex items-end gap-4">
          <span>
            <span className="block font-heading text-4xl font-extrabold leading-none">{post.repercussao}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-amarelo-900">repercussão</span>
          </span>
          <span className="pb-1 text-xs text-amarelo-900">
            {post.recorrencia} {post.recorrencia === 1 ? 'relato parecido' : 'relatos parecidos'} na área ·{' '}
            {post.interacoes} {post.interacoes === 1 ? 'apoio' : 'apoios'}
          </span>
        </span>
      </Link>

      <motion.button
        type="button"
        onClick={() => onVerNoMapa(post.id)}
        aria-label={`Ver no mapa: ${post.bairro}`}
        title="Ver no mapa"
        whileHover={{ scale: 1.1, rotate: 12 }}
        whileTap={{ scale: 0.9 }}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-grafite-900 text-amarelo-300"
      >
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
        </svg>
      </motion.button>
    </motion.div>
  )
}
