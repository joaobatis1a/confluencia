import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import type { Comentario, PerfilPublico } from '../../../types/database'
import { formatRelativo } from '../../../lib/repercussao'
import { buscarPerfis, nomePublico } from '../perfis'
import { Avatar, SeloOrgao } from './Autor'

const LIMITE = 500

// Comentários do relato: vizinhos confirmam ("aqui também") e acrescentam detalhes.
export default function Comentarios({ postId, onTotal }: { postId: string; onTotal?: (n: number) => void }) {
  const { user } = useAuth()
  const [lista, setLista] = useState<Comentario[] | null>(null)
  const [perfis, setPerfis] = useState<Map<string, PerfilPublico>>(new Map())
  const [indisponivel, setIndisponivel] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('comentarios')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(async ({ data, error }) => {
        if (cancelado) return
        if (error) {
          setIndisponivel(true)
          return
        }
        const itens = (data ?? []) as Comentario[]
        setPerfis(await buscarPerfis(itens.map((c) => c.user_id)))
        if (!cancelado) setLista(itens)
      })
    return () => {
      cancelado = true
    }
  }, [postId])

  async function comentar(e: FormEvent) {
    e.preventDefault()
    if (!user || !texto.trim()) return
    setEnviando(true)
    setErro(null)
    const { data, error } = await supabase
      .from('comentarios')
      .insert({ post_id: postId, user_id: user.id, texto: texto.trim() })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      setErro(`Não foi possível comentar: ${error.message}`)
      return
    }
    setPerfis(await buscarPerfis([...perfis.keys(), user.id]))
    const nova = [...(lista ?? []), data as Comentario]
    setLista(nova)
    onTotal?.(nova.length)
    setTexto('')
  }

  async function apagar(id: string) {
    const anterior = lista ?? []
    const nova = anterior.filter((c) => c.id !== id)
    setLista(nova)
    const { error } = await supabase.from('comentarios').delete().eq('id', id)
    if (error) setLista(anterior)
    else onTotal?.(nova.length)
  }

  if (indisponivel) return null

  return (
    <section className="mt-20">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amarelo-700">Comentários</p>
        {lista && <span className="text-sm text-grafite-500">{lista.length}</span>}
      </div>

      {user ? (
        <form onSubmit={comentar} className="mt-6">
          <div className="rounded-[24px] border border-grafite-200 bg-white p-2 focus-within:border-amarelo-500 focus-within:shadow-[0_0_0_4px_rgba(245,184,0,0.18)]">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={LIMITE}
              rows={2}
              placeholder="Isso também acontece perto de você? Conte aqui."
              aria-label="Escrever comentário"
              className="w-full resize-none bg-transparent px-3 py-2 text-sm text-grafite-900 placeholder:text-grafite-500 focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <span className={`text-xs ${texto.length > LIMITE * 0.9 ? 'text-status-terracota-700' : 'text-grafite-500'}`}>
                {texto.length}/{LIMITE}
              </span>
              <motion.button
                type="submit"
                disabled={enviando || !texto.trim()}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-amarelo-500 px-4 py-2 text-sm font-bold text-grafite-900 disabled:opacity-50"
              >
                {enviando ? 'Enviando…' : 'Comentar'}
              </motion.button>
            </div>
          </div>
          {erro && <p className="mt-2 text-xs text-status-vermelho-700">{erro}</p>}
        </form>
      ) : (
        <p className="mt-6 rounded-[24px] bg-grafite-100 p-4 text-sm text-grafite-700">
          <Link to="/entrar" className="font-semibold text-amarelo-700 hover:underline">
            Entre
          </Link>{' '}
          para comentar.
        </p>
      )}

      {lista === null ? (
        <div className="mt-6 h-20 animate-pulse rounded-[24px] bg-grafite-100" />
      ) : lista.length === 0 ? (
        <p className="mt-6 text-sm text-grafite-500">Ninguém comentou ainda. Seja o primeiro a confirmar ou acrescentar algo.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          <AnimatePresence initial={false}>
            {lista.map((c) => {
              const autor = perfis.get(c.user_id)
              return (
                <motion.li
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-3"
                >
                  <Link to={`/u/${c.user_id}`} className="flex-shrink-0">
                    <Avatar perfil={autor} size={36} />
                  </Link>
                  <div className="min-w-0 flex-1 rounded-[20px] rounded-tl-md bg-white px-4 py-3 shadow-[0_2px_8px_-4px_rgba(27,24,19,0.15)]">
                    <div className="flex items-center justify-between gap-2">
                      <Link to={`/u/${c.user_id}`} className="flex items-center gap-1.5 text-sm font-bold text-grafite-900 hover:underline">
                        {nomePublico(autor)}
                        {autor?.institucional_verificado && <SeloOrgao />}
                      </Link>
                      <span className="flex items-center gap-2 text-[11px] text-grafite-500">
                        {formatRelativo(c.created_at)}
                        {user?.id === c.user_id && (
                          <button type="button" onClick={() => apagar(c.id)} className="font-semibold hover:text-status-vermelho-700">
                            Apagar
                          </button>
                        )}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-line break-words text-sm text-grafite-800">{c.texto}</p>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
