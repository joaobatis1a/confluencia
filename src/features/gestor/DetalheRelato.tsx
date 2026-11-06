import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CATEGORIAS, STATUS_RESPOSTA_LABELS, type PostRepercussao, type RespostaOficial, type StatusResposta } from '../../types/database'
import { formatRelativo, nivelRepercussao } from '../../lib/repercussao'
import { CATEGORIA_RGB, rgb } from '../feed/cores'
import IconeCategoria from '../feed/components/IconeCategoria'
import CapaRelato from '../feed/components/CapaRelato'
import { Avatar } from '../feed/components/Autor'
import { buscarPerfis, nomePublico, usePerfis } from '../feed/perfis'
import { diasDesde, faseDoRelato } from './dados'
import { Icone, TOM, type Tom } from './CentralShell'

// Detalhe de um relato dentro da própria Central: foto, texto inteiro, quem
// relatou, os números, onde fica, o histórico de respostas e o formulário para
// responder, sem sair da fila.

const NIVEL_TOM: Record<ReturnType<typeof nivelRepercussao>, { tom: Tom; rotulo: string }> = {
  alta: { tom: 'vermelho', rotulo: 'Repercussão alta' },
  media: { tom: 'amarelo', rotulo: 'Repercussão média' },
  baixa: { tom: 'cinza', rotulo: 'Repercussão baixa' },
}
const FASE_TOM = { pendente: 'vermelho', andamento: 'azul', concluido: 'verde' } as const
const FASE_ROTULO = { pendente: 'Sem resposta', andamento: 'Em andamento', concluido: 'Encerrado' } as const
const OPCOES: StatusResposta[] = ['recebido', 'em_analise', 'resolvido', 'nao_procede']

export function Chip({ tom, children }: { tom: Tom; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${TOM[tom].fundo} ${TOM[tom].texto}`}>{children}</span>
}

export default function DetalheRelato({ relato: r, onFechar, onStatus }: { relato: PostRepercussao; onFechar: () => void; onStatus: (id: string, s: StatusResposta) => void }) {
  const perfis = usePerfis([r.user_id])
  const perfil = r.user_id ? perfis.get(r.user_id) : undefined
  const categoria = CATEGORIAS.find((c) => c.value === r.categoria)?.label ?? r.categoria
  const cor = rgb(CATEGORIA_RGB[r.categoria])
  const nivel = NIVEL_TOM[nivelRepercussao(r.repercussao)]
  const fase = faseDoRelato(r)
  const dias = diasDesde(r.created_at)

  const numeros = [
    { v: r.repercussao, l: 'repercussão', d: 'recorrência + apoios' },
    { v: r.interacoes, l: r.interacoes === 1 ? 'apoio' : 'apoios', d: 'de vizinhos' },
    { v: r.comentarios ?? 0, l: (r.comentarios ?? 0) === 1 ? 'comentário' : 'comentários', d: 'na conversa' },
    { v: r.recorrencia, l: 'parecidos', d: 'na área, em 30 dias' },
  ]

  return (
    <motion.article
      key={r.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: 'spring', stiffness: 360, damping: 34 }}
      className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_48px_-28px_rgba(27,24,19,0.45)] ring-1 ring-grafite-200"
      aria-label={`Relato em ${r.bairro}`}
    >
      <div className="relative">
        <CapaRelato fotoUrl={r.foto_url} bairro={r.bairro} className="h-44" />
        <button type="button" onClick={onFechar} aria-label="Fechar detalhe" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg text-grafite-900 shadow transition-transform hover:scale-105">
          ×
        </button>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: cor }}>
            <IconeCategoria categoria={r.categoria} size={13} />
            {categoria}
          </span>
          <Chip tom={FASE_TOM[fase]}>{FASE_ROTULO[fase]}</Chip>
          <Chip tom={nivel.tom}>{nivel.rotulo}</Chip>
          {fase === 'pendente' && dias > 7 && <Chip tom="vermelho">há {dias} dias esperando</Chip>}
        </div>

        <h2 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-grafite-900">{r.bairro}</h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-grafite-500">
          <Avatar perfil={perfil} anonimo={!r.user_id} size={22} />
          <span>
            {r.user_id ? nomePublico(perfil) : 'Relato anônimo'} · {formatRelativo(r.created_at)}
          </span>
        </p>

        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-grafite-900">{r.descricao}</p>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {numeros.map((n) => (
            <div key={n.l} className="rounded-2xl bg-grafite-50 p-3 ring-1 ring-grafite-100">
              <dd className="font-heading text-2xl font-extrabold leading-none text-grafite-900">{n.v}</dd>
              <dt className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-grafite-700">{n.l}</dt>
              <span className="text-[11px] text-grafite-500">{n.d}</span>
            </div>
          ))}
        </dl>

        <a
          href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=17/${r.latitude}/${r.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-2 rounded-2xl bg-grafite-50 px-4 py-3 text-sm text-grafite-700 ring-1 ring-grafite-100 transition-colors hover:bg-amarelo-50"
        >
          <span className="text-grafite-500">
            <Icone nome="pin" />
          </span>
          <span className="min-w-0 flex-1 truncate">
            {r.bairro} · {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
          </span>
          <span className="shrink-0 text-xs font-bold text-amarelo-700">Ver no mapa ↗</span>
        </a>

        <Historico postId={r.id} onStatus={onStatus} />

        <div className="mt-6 flex flex-wrap gap-2 border-t border-grafite-100 pt-5">
          {fase !== 'concluido' && (
            <Link to={`/projetos/novo?origem=${r.id}`} className="rounded-full bg-grafite-900 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
              Virar projeto
            </Link>
          )}
          <Link to={`/feed/${r.id}`} className="rounded-full px-5 py-2.5 text-sm font-bold text-grafite-900 ring-1 ring-grafite-300 transition-colors hover:bg-grafite-50">
            Abrir página completa
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

// Histórico de respostas oficiais + formulário para responder.
function Historico({ postId, onStatus }: { postId: string; onStatus: (id: string, s: StatusResposta) => void }) {
  const { user } = useAuth()
  const [respostas, setRespostas] = useState<RespostaOficial[] | null>(null)
  const [nomes, setNomes] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<StatusResposta>('recebido')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelado = false
    supabase
      .from('respostas_oficiais')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(async ({ data }) => {
        const lista = (data ?? []) as RespostaOficial[]
        const mapa = await buscarPerfis(lista.map((x) => x.orgao_id))
        if (cancelado) return
        setNomes(Object.fromEntries([...mapa].map(([id, p]) => [id, nomePublico(p)])))
        setRespostas(lista)
      })
    return () => {
      cancelado = true
    }
  }, [postId])

  async function responder(e: FormEvent) {
    e.preventDefault()
    if (!user || !texto.trim()) return
    setEnviando(true)
    setErro(null)
    const { data, error } = await supabase
      .from('respostas_oficiais')
      .insert({ post_id: postId, orgao_id: user.id, status, texto: texto.trim() })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      setErro(`Não foi possível publicar a resposta: ${error.message}`)
      return
    }
    const mapa = await buscarPerfis([user.id])
    setNomes((n) => ({ ...n, [user.id]: nomePublico(mapa.get(user.id)) }))
    setRespostas((l) => [...(l ?? []), data as RespostaOficial])
    onStatus(postId, status)
    setTexto('')
  }

  if (!isSupabaseConfigured) {
    return <p className="mt-6 rounded-2xl bg-grafite-50 p-4 text-sm text-grafite-500">As respostas oficiais aparecem aqui quando o sistema está ligado ao banco.</p>
  }

  return (
    <section className="mt-6" aria-label="Respostas oficiais">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-grafite-500">Respostas do órgão</h3>
      {respostas === null ? (
        <div className="mt-3 h-16 animate-pulse rounded-2xl bg-grafite-100" />
      ) : respostas.length === 0 ? (
        <p className="mt-3 rounded-2xl border-2 border-dashed border-grafite-200 p-4 text-sm text-grafite-500">Ninguém respondeu ainda. A resposta aparece para toda a cidade.</p>
      ) : (
        <ol className="relative mt-3 space-y-3 border-l-2 border-dashed border-grafite-200 pl-4">
          {respostas.map((x) => (
            <li key={x.id} className="relative">
              <span className="absolute -left-[22px] top-2 h-3 w-3 rounded-full border-2 border-white bg-status-azul-500" />
              <div className="rounded-2xl bg-status-azul-50/60 p-3 ring-1 ring-status-azul-50">
                <p className="flex flex-wrap items-center gap-2 text-xs">
                  <b className="text-grafite-900">{nomes[x.orgao_id] ?? 'Órgão'}</b>
                  <Chip tom={x.status === 'resolvido' || x.status === 'virou_projeto' ? 'verde' : x.status === 'nao_procede' ? 'cinza' : 'azul'}>{STATUS_RESPOSTA_LABELS[x.status]}</Chip>
                  <span className="text-grafite-500">{formatRelativo(x.created_at)}</span>
                </p>
                <p className="mt-1.5 text-sm text-grafite-900">{x.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={responder} className="mt-4 rounded-2xl bg-grafite-50 p-4 ring-1 ring-grafite-100">
        <p className="text-sm font-bold text-grafite-900">Responder em nome do órgão</p>
        <div role="radiogroup" aria-label="Situação" className="mt-2 flex flex-wrap gap-1.5">
          {OPCOES.map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={status === o}
              onClick={() => setStatus(o)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${status === o ? 'bg-grafite-900 text-white' : 'bg-white text-grafite-700 ring-1 ring-grafite-200 hover:ring-grafite-400'}`}
            >
              {STATUS_RESPOSTA_LABELS[o]}
            </button>
          ))}
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="O que o órgão vai fazer, ou o que já foi feito."
          aria-label="Texto da resposta"
          className="mt-3 w-full resize-none rounded-2xl border border-grafite-300 bg-white px-4 py-3 text-sm text-grafite-900 focus:border-amarelo-500 focus:outline-none focus:ring-4 focus:ring-amarelo-500/20"
        />
        {erro && <p className="mt-2 rounded-xl bg-status-vermelho-50 px-3 py-2 text-xs text-status-vermelho-700">{erro}</p>}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-grafite-500">{texto.length}/500</span>
          <button type="submit" disabled={enviando || !texto.trim()} className="rounded-full bg-amarelo-500 px-5 py-2 text-sm font-bold text-grafite-900 transition-transform hover:-translate-y-0.5 disabled:bg-grafite-200 disabled:text-grafite-500 disabled:hover:translate-y-0">
            {enviando ? 'Publicando…' : 'Publicar resposta'}
          </button>
        </div>
      </form>
    </section>
  )
}
