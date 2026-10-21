import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatRelativo } from '../lib/repercussao'

interface Notificacao {
  id: string
  tipo: 'resposta_oficial' | 'comentario' | 'apoio' | 'novo_relato_bairro'
  titulo: string
  texto: string | null
  link: string | null
  lida: boolean
  created_at: string
}

const ICONE: Record<Notificacao['tipo'], { emoji: string; cor: string }> = {
  resposta_oficial: { emoji: '🏛', cor: 'bg-status-azul-50' },
  comentario: { emoji: '💬', cor: 'bg-amarelo-100' },
  apoio: { emoji: '♥', cor: 'bg-categoria-rosa-50' },
  novo_relato_bairro: { emoji: '📍', cor: 'bg-status-verde-50' },
}

// Notificações (tabela `notificacoes`, 0006): criadas pelo banco quando o
// órgão responde, alguém comenta/apoia seu relato ou sai relato novo num
// bairro seguido. Chegam em tempo real (Supabase Realtime).
function useNotificacoes() {
  const { user } = useAuth()
  const [lista, setLista] = useState<Notificacao[]>([])
  const [disponivel, setDisponivel] = useState(false)

  const carregar = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setDisponivel(!error)
    if (!error) setLista((data ?? []) as Notificacao[])
  }, [user])

  useEffect(() => {
    if (!user) return
    let ativo = true
    queueMicrotask(() => {
      if (ativo) carregar()
    })
    const canal = supabase
      .channel(`notificacoes-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (ativo) setLista((atual) => [payload.new as Notificacao, ...atual].slice(0, 30))
        },
      )
      .subscribe()
    return () => {
      ativo = false
      supabase.removeChannel(canal)
    }
  }, [user, carregar])

  async function marcarLida(id: string) {
    setLista((atual) => atual.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
  }

  async function marcarTodas() {
    if (!user) return
    setLista((atual) => atual.map((n) => ({ ...n, lida: true })))
    await supabase.from('notificacoes').update({ lida: true }).eq('user_id', user.id).eq('lida', false)
  }

  return { lista, disponivel, naoLidas: lista.filter((n) => !n.lida).length, marcarLida, marcarTodas, carregar }
}

export default function Notificacoes() {
  const { lista, disponivel, naoLidas, marcarLida, marcarTodas, carregar } = useNotificacoes()
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const id = useId()

  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false)
        botao.current?.focus()
      }
    }
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  if (!disponivel) return null

  function abrirNotificacao(n: Notificacao) {
    if (!n.lida) marcarLida(n.id)
    setAberto(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div ref={raiz} className="relative">
      <motion.button
        ref={botao}
        type="button"
        onClick={() => {
          if (!aberto) carregar()
          setAberto((a) => !a)
        }}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={`${id}-painel`}
        aria-label={naoLidas ? `Notificações: ${naoLidas} não lidas` : 'Notificações'}
        whileTap={{ scale: 0.92 }}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
          aberto ? 'border-amarelo-500 bg-amarelo-50' : 'border-grafite-200 bg-white hover:border-grafite-300'
        }`}
      >
        <motion.svg
          key={naoLidas}
          viewBox="0 0 24 24"
          width={19}
          height={19}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-grafite-900"
          animate={naoLidas ? { rotate: [0, -14, 12, -8, 6, 0] } : {}}
          transition={{ duration: 0.7 }}
          aria-hidden
        >
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </motion.svg>
        <AnimatePresence>
          {naoLidas > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 18 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-status-vermelho-500 px-1 text-[10px] font-bold text-white"
            >
              {naoLidas > 9 ? '9+' : naoLidas}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            id={`${id}-painel`}
            role="dialog"
            aria-label="Notificações"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 480, damping: 34 }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl border border-grafite-200 bg-white shadow-[0_24px_50px_-18px_rgba(27,24,19,0.4)]"
          >
            <div className="flex items-center justify-between border-b border-grafite-100 px-5 py-4">
              <p className="font-heading text-lg font-extrabold text-grafite-900">Notificações</p>
              {naoLidas > 0 && (
                <button type="button" onClick={marcarTodas} className="text-xs font-semibold text-amarelo-700 hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            {lista.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-3xl" aria-hidden>
                  🔔
                </p>
                <p className="mt-2 text-sm font-semibold text-grafite-900">Nada por aqui ainda</p>
                <p className="mt-1 text-xs text-grafite-500">
                  Você é avisado quando o órgão responder seus relatos, alguém comentar ou apoiar, e quando sair relato
                  novo nos bairros que você segue.
                </p>
              </div>
            ) : (
              <ul className="max-h-[26rem] overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin]">
                {lista.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.03 }}
                  >
                    <button
                      type="button"
                      onClick={() => abrirNotificacao(n)}
                      className={`flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-grafite-50 ${
                        n.lida ? '' : 'bg-amarelo-50/70'
                      }`}
                    >
                      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg ${ICONE[n.tipo].cor}`} aria-hidden>
                        {ICONE[n.tipo].emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-snug text-grafite-900">{n.titulo}</span>
                        {n.texto && <span className="mt-0.5 block text-xs text-grafite-700 line-clamp-2">{n.texto}</span>}
                        <span className="mt-1 block text-[11px] text-grafite-500">{formatRelativo(n.created_at)}</span>
                      </span>
                      {!n.lida && <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amarelo-500" aria-label="não lida" />}
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
