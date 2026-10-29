import { useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProjetosSalvos } from '../useProjetosSalvos'

interface BotaoSalvarProps {
  projetoId: string
  /** 'icone' para cima da capa do card; 'completo' com texto, no detalhe. */
  variante?: 'icone' | 'completo'
}

// Salvar um projeto para acompanhar — marcador que "enche" com uma faísca ao salvar.
export default function BotaoSalvar({ projetoId, variante = 'icone' }: BotaoSalvarProps) {
  const { estaSalvo, alternar } = useProjetosSalvos()
  const salvo = estaSalvo(projetoId)
  const [faisca, setFaisca] = useState(0)

  function clicar(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!salvo) setFaisca((n) => n + 1)
    alternar(projetoId)
  }

  const marcador = (
    <span className="relative inline-flex">
      <motion.svg
        key={salvo ? 'cheio' : 'vazio'}
        viewBox="0 0 24 24"
        width={variante === 'icone' ? 18 : 20}
        height={variante === 'icone' ? 18 : 20}
        fill={salvo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        initial={{ scale: 0.6, rotate: salvo ? -15 : 0 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 14 }}
        aria-hidden
      >
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      </motion.svg>
      <AnimatePresence>
        {salvo && faisca > 0 && (
          <motion.span
            key={faisca}
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-amarelo-500"
            initial={{ scale: 0.6, opacity: 1 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </span>
  )

  if (variante === 'icone') {
    return (
      <motion.button
        type="button"
        onClick={clicar}
        aria-pressed={salvo}
        aria-label={salvo ? 'Deixar de acompanhar' : 'Salvar para acompanhar'}
        title={salvo ? 'Acompanhando — clique para remover' : 'Salvar para acompanhar'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur transition-colors ${
          salvo ? 'bg-amarelo-500 text-grafite-900' : 'bg-white/85 text-grafite-900 hover:bg-white'
        }`}
      >
        {marcador}
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={clicar}
      aria-pressed={salvo}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors ${
        salvo
          ? 'bg-amarelo-500 text-grafite-900 shadow-[0_10px_22px_-12px_rgba(245,184,0,0.9)]'
          : 'bg-white/90 text-grafite-900 backdrop-blur hover:bg-white'
      }`}
    >
      {marcador}
      {salvo ? 'Acompanhando' : 'Acompanhar projeto'}
    </motion.button>
  )
}
