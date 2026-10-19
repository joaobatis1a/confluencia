import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface SeletorBairroProps {
  /** Bairros com a quantidade de relatos de cada um. */
  opcoes: { bairro: string; total: number }[]
  totalGeral: number
  value: string
  onChange: (bairro: string) => void
}

// Menu de bairros próprio (o <select> nativo abre uma lista crua do sistema):
// abre animado, mostra quantos relatos cada bairro tem e funciona no teclado.
export default function SeletorBairro({ opcoes, totalGeral, value, onChange }: SeletorBairroProps) {
  const id = useId()
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const raiz = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLUListElement>(null)

  const itens = [{ bairro: '', total: totalGeral }, ...opcoes]

  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('pointerdown', fora)
    return () => document.removeEventListener('pointerdown', fora)
  }, [aberto])

  useEffect(() => {
    if (aberto) lista.current?.focus()
  }, [aberto])

  useEffect(() => {
    if (aberto) lista.current?.querySelector(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [aberto, ativo])

  function abrir() {
    setAtivo(Math.max(0, itens.findIndex((i) => i.bairro === value)))
    setAberto(true)
  }

  function escolher(bairro: string) {
    onChange(bairro)
    setAberto(false)
    botao.current?.focus()
  }

  function teclado(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAtivo((i) => Math.min(itens.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      escolher(itens[ativo].bairro)
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setAberto(false)
      botao.current?.focus()
    }
  }

  return (
    <div ref={raiz} className="relative">
      <button
        ref={botao}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        className={`flex items-center gap-2 rounded-full border py-1.5 pl-3 pr-2.5 text-xs font-semibold transition-colors ${
          value
            ? 'border-amarelo-500 bg-amarelo-50 text-grafite-900'
            : 'border-grafite-200 bg-white text-grafite-900 hover:border-grafite-300'
        }`}
      >
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        <span className="max-w-[160px] truncate">{value || 'Todos os bairros'}</span>
        <motion.svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          animate={{ rotate: aberto ? 180 : 0 }}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.ul
            ref={lista}
            id={`${id}-lista`}
            role="listbox"
            tabIndex={-1}
            aria-label="Bairro"
            aria-activedescendant={`${id}-op-${ativo}`}
            onKeyDown={teclado}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-[calc(100%+8px)] z-30 max-h-72 w-60 overflow-y-auto rounded-2xl border border-grafite-200 bg-white p-1.5 shadow-[0_20px_44px_-16px_rgba(27,24,19,0.35)] focus:outline-none [scrollbar-width:thin]"
          >
            {itens.map((item, i) => {
              const selecionado = item.bairro === value
              return (
                <li
                  key={item.bairro || 'todos'}
                  id={`${id}-op-${i}`}
                  data-indice={i}
                  role="option"
                  aria-selected={selecionado}
                  onPointerEnter={() => setAtivo(i)}
                  onClick={() => escolher(item.bairro)}
                  className={`relative flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    i === ativo ? 'bg-amarelo-50' : ''
                  } ${selecionado ? 'font-semibold text-grafite-900' : 'text-grafite-700'}`}
                >
                  <span className="flex h-4 w-4 items-center justify-center text-amarelo-700">
                    {selecionado && (
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
                        <path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 truncate">{item.bairro || 'Todos os bairros'}</span>
                  <span className="rounded-full bg-grafite-100 px-2 py-0.5 text-[11px] font-semibold text-grafite-500">
                    {item.total}
                  </span>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
