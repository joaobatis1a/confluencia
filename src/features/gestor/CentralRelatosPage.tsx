import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORIAS, STATUS_RESPOSTA_LABELS, type Categoria, type PostRepercussao } from '../../types/database'
import { CATEGORIA_RGB, rgb } from '../feed/cores'
import IconeCategoria from '../feed/components/IconeCategoria'
import { nivelRepercussao } from '../../lib/repercussao'
import { diasDesde, faseDoRelato, useRelatosGestor, type Fase } from './dados'
import { BarrasBairros, CountUp, Painel, RoscaCategorias, Sparkline } from './graficos'
import CentralShell, { Numero } from './CentralShell'

// Feed do órgão: em vez de uma vitrine de relatos, uma fila de trabalho.
// O que pede resposta primeiro (repercussão alta, sem resposta, há mais tempo),
// com as ações do gestor ao lado de cada relato.

const COR_NIVEL = { alta: '#d63b2f', media: '#f5b800', baixa: '#7c776c' } as const
const FASES: { valor: Fase | 'todos'; rotulo: string }[] = [
  { valor: 'pendente', rotulo: 'Sem resposta' },
  { valor: 'andamento', rotulo: 'Em andamento' },
  { valor: 'concluido', rotulo: 'Encerrados' },
  { valor: 'todos', rotulo: 'Todos' },
]
const ORDENS = [
  { valor: 'urgencia', rotulo: 'Mais urgentes' },
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'antigos', rotulo: 'Mais antigos' },
] as const

export default function CentralRelatosPage() {
  const relatos = useRelatosGestor()
  const [fase, setFase] = useState<Fase | 'todos'>('pendente')
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas')
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<(typeof ORDENS)[number]['valor']>('urgencia')

  const todos = useMemo(() => relatos ?? [], [relatos])
  const numeros = useMemo(() => {
    const pend = todos.filter((r) => faseDoRelato(r) === 'pendente')
    return {
      total: todos.length,
      pend: pend.length,
      urgentes: pend.filter((r) => nivelRepercussao(r.repercussao) === 'alta').length,
      velhos: pend.filter((r) => diasDesde(r.created_at) > 7).length,
    }
  }, [todos])

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const lista = todos.filter(
      (r) =>
        (fase === 'todos' || faseDoRelato(r) === fase) &&
        (categoria === 'todas' || r.categoria === categoria) &&
        (!termo || r.bairro.toLowerCase().includes(termo) || r.descricao.toLowerCase().includes(termo)),
    )
    const t = (r: PostRepercussao) => new Date(r.created_at).getTime()
    return lista.sort((a, b) => (ordem === 'urgencia' ? b.repercussao - a.repercussao || t(a) - t(b) : ordem === 'recentes' ? t(b) - t(a) : t(a) - t(b)))
  }, [todos, fase, categoria, busca, ordem])

  const base = fase === 'todos' ? todos : todos.filter((r) => faseDoRelato(r) === fase)

  return (
    <CentralShell
      kicker="Central de relatos"
      titulo="O que a cidade está pedindo"
      sub="Os relatos da cidade inteira, ordenados pelo que mais precisa de resposta. Responda, vire projeto ou encerre."
      verComoMorador="/feed"
    >
      <div className="mt-10 grid grid-cols-2 border-t-2 border-amarelo-500 lg:grid-cols-4">
        <Numero valor={<CountUp valor={numeros.pend} />} rotulo="sem resposta" frase="esperando o órgão" />
        <Numero valor={<CountUp valor={numeros.urgentes} />} rotulo="alta repercussão" frase="o bairro inteiro apoiou" alerta={numeros.urgentes > 0} />
        <Numero valor={<CountUp valor={numeros.velhos} />} rotulo="há mais de 7 dias" frase="sem ninguém responder" alerta={numeros.velhos > 0} />
        <Numero valor={<CountUp valor={numeros.total} />} rotulo="relatos na cidade" frase="desde o início" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Filtrar por situação">
            {FASES.map((f) => {
              const ativo = fase === f.valor
              const qtd = f.valor === 'todos' ? todos.length : todos.filter((r) => faseDoRelato(r) === f.valor).length
              return (
                <button
                  key={f.valor}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setFase(f.valor)}
                  className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${ativo ? 'text-grafite-900' : 'text-white/60 hover:text-white'}`}
                >
                  {ativo && <motion.span layoutId="fase-central" className="absolute inset-0 rounded-full bg-amarelo-500" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative">
                    {f.rotulo} <span className="opacity-60">{qtd}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por bairro ou palavra"
              aria-label="Buscar relatos"
              className="min-w-[200px] flex-1 rounded-full bg-white/[0.06] px-4 py-2.5 text-sm text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amarelo-500"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria | 'todas')}
              aria-label="Categoria"
              className="rounded-full bg-grafite-900 px-4 py-2.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-amarelo-500"
            >
              <option value="todas">Todas as categorias</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as typeof ordem)}
              aria-label="Ordenar"
              className="rounded-full bg-grafite-900 px-4 py-2.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-amarelo-500"
            >
              {ORDENS.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </div>

          {/* Fila */}
          {relatos === null ? (
            <ul className="mt-6 space-y-3" aria-busy>
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="h-28 animate-pulse rounded-[22px] bg-white/[0.05]" />
              ))}
            </ul>
          ) : visiveis.length === 0 ? (
            <div className="mt-6 rounded-[24px] border-2 border-dashed border-white/15 px-6 py-14 text-center">
              <p className="font-heading text-xl font-bold">{fase === 'pendente' ? 'Fila em dia' : 'Nada por aqui'}</p>
              <p className="mt-1 text-sm text-white/50">{fase === 'pendente' ? 'Nenhum relato esperando resposta neste filtro.' : 'Nenhum relato neste filtro.'}</p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {visiveis.slice(0, 40).map((r, i) => (
                  <Ticket key={r.id} relato={r} indice={i} />
                ))}
              </AnimatePresence>
              {visiveis.length > 40 && <li className="pt-2 text-center text-sm text-white/40">Mostrando 40 de {visiveis.length}. Use os filtros para afinar.</li>}
            </ul>
          )}
        </div>

        {/* Leitura da cidade */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Leitura da cidade">
          <Painel titulo="Onde pesa mais" nota={fase === 'todos' ? 'todos' : FASES.find((f) => f.valor === fase)?.rotulo.toLowerCase()}>
            <BarrasBairros relatos={base} />
          </Painel>
          <Painel titulo="Por categoria">
            <RoscaCategorias relatos={base} />
          </Painel>
          <Painel titulo="Ritmo">
            <Sparkline relatos={todos} />
          </Painel>
        </aside>
      </div>
    </CentralShell>
  )
}

function Ticket({ relato: r, indice }: { relato: PostRepercussao; indice: number }) {
  const nivel = nivelRepercussao(r.repercussao)
  const fase = faseDoRelato(r)
  const dias = diasDesde(r.created_at)
  const atrasado = fase === 'pendente' && dias > 7
  const categoria = CATEGORIAS.find((c) => c.value === r.categoria)?.label ?? r.categoria
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30, delay: Math.min(indice, 8) * 0.03 }}
      className="group relative flex gap-4 overflow-hidden rounded-[22px] bg-white/[0.05] p-4 pl-5 ring-1 ring-white/10 transition-colors hover:bg-white/[0.08]"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: COR_NIVEL[nivel] }} />
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: rgb(CATEGORIA_RGB[r.categoria]) }}>
        <IconeCategoria categoria={r.categoria} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <b className="text-white">{r.bairro}</b>
          <span className="text-white/45">
            {categoria} · {dias <= 0 ? 'hoje' : `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
          </span>
          {atrasado && <span className="rounded-full bg-status-vermelho-500/20 px-2 py-0.5 font-bold text-status-vermelho-500">sem resposta há {dias} dias</span>}
          {r.status_oficial && <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold text-white/80">{STATUS_RESPOSTA_LABELS[r.status_oficial]}</span>}
        </div>
        <p className="mt-1.5 line-clamp-2 text-[15px] leading-snug text-white/90">{r.descricao}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link to={`/feed/${r.id}`} className="rounded-full bg-amarelo-500 px-4 py-1.5 text-xs font-bold text-grafite-900 transition-transform hover:-translate-y-0.5">
            {fase === 'pendente' ? 'Responder' : 'Abrir'}
          </Link>
          {fase !== 'concluido' && (
            <Link to={`/projetos/novo?origem=${r.id}`} className="rounded-full px-4 py-1.5 text-xs font-bold text-amarelo-500 ring-1 ring-amarelo-500/40 transition-colors hover:bg-amarelo-500/10">
              Virar projeto
            </Link>
          )}
          <span className="text-xs text-white/40">
            {r.interacoes} {r.interacoes === 1 ? 'apoio' : 'apoios'}
            {typeof r.comentarios === 'number' && ` · ${r.comentarios} ${r.comentarios === 1 ? 'comentário' : 'comentários'}`}
          </span>
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-heading text-4xl font-extrabold leading-none" style={{ color: COR_NIVEL[nivel] }}>
          {r.repercussao}
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">repercussão</p>
      </div>
    </motion.li>
  )
}
