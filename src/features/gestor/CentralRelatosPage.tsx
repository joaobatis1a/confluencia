import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORIAS, type Categoria, type PostRepercussao } from '../../types/database'
import { CATEGORIA_RGB, rgb } from '../feed/cores'
import IconeCategoria from '../feed/components/IconeCategoria'
import AnelRepercussao from '../feed/components/AnelRepercussao'
import { useDesktop } from '../feed/useDesktop'
import { nivelRepercussao, type RepercussaoNivel } from '../../lib/repercussao'
import { diasDesde, faseDoRelato, useRelatosGestor, type Fase } from './dados'
import { BarrasBairros, CountUp, Painel, RoscaCategorias, Sparkline } from './graficos'
import CentralShell, { KpiCard } from './CentralShell'
import DetalheRelato, { Chip } from './DetalheRelato'

// Feed do órgão: uma fila de trabalho. Os filtros mostram quantos relatos tem
// em cada recorte; clicar num relato abre o detalhe ao lado (foto, texto inteiro,
// números, histórico e formulário de resposta) sem sair da fila.

type FaseFiltro = Fase | 'todos'
type Urgencia = RepercussaoNivel | 'todas'
type Ordem = 'urgencia' | 'recentes' | 'antigos'

const FASES: { valor: FaseFiltro; rotulo: string }[] = [
  { valor: 'pendente', rotulo: 'Sem resposta' },
  { valor: 'andamento', rotulo: 'Em andamento' },
  { valor: 'concluido', rotulo: 'Encerrados' },
  { valor: 'todos', rotulo: 'Todos' },
]
const URGENCIAS: { valor: RepercussaoNivel; rotulo: string; cor: string }[] = [
  { valor: 'alta', rotulo: 'Alta', cor: '#dc2626' },
  { valor: 'media', rotulo: 'Média', cor: '#f5b800' },
  { valor: 'baixa', rotulo: 'Baixa', cor: '#7c776c' },
]
const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'urgencia', rotulo: 'Urgência' },
  { valor: 'recentes', rotulo: 'Recentes' },
  { valor: 'antigos', rotulo: 'Antigos' },
]
const COR_NIVEL = { alta: '#dc2626', media: '#f5b800', baixa: '#cfcbc0' } as const

export default function CentralRelatosPage() {
  const { relatos, definirStatus } = useRelatosGestor()
  const [params] = useSearchParams()
  const desktop = useDesktop()
  const [fase, setFase] = useState<FaseFiltro>(() => (FASES.find((f) => f.valor === params.get('fase'))?.valor ?? 'pendente'))
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas')
  const [urg, setUrg] = useState<Urgencia>(() => (URGENCIAS.find((u) => u.valor === params.get('urg'))?.valor ?? 'todas'))
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('urgencia')
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [limite, setLimite] = useState(30)
  const [rolou, setRolou] = useState(false)
  const listaRef = useRef<HTMLDivElement>(null)

  const todos = useMemo(() => relatos ?? [], [relatos])

  // Cada grupo de filtros conta os relatos respeitando os OUTROS filtros.
  const passa = (r: PostRepercussao, pular?: 'fase' | 'cat' | 'urg') => {
    const termo = busca.trim().toLowerCase()
    return (
      (pular === 'fase' || fase === 'todos' || faseDoRelato(r) === fase) &&
      (pular === 'cat' || categoria === 'todas' || r.categoria === categoria) &&
      (pular === 'urg' || urg === 'todas' || nivelRepercussao(r.repercussao) === urg) &&
      (!termo || r.bairro.toLowerCase().includes(termo) || r.descricao.toLowerCase().includes(termo))
    )
  }
  const contar = (pular: 'fase' | 'cat' | 'urg', teste: (r: PostRepercussao) => boolean) => todos.filter((r) => passa(r, pular) && teste(r)).length

  const visiveis = useMemo(() => {
    const t = (r: PostRepercussao) => new Date(r.created_at).getTime()
    return todos
      .filter((r) => passa(r))
      .sort((a, b) => (ordem === 'urgencia' ? b.repercussao - a.repercussao || t(a) - t(b) : ordem === 'recentes' ? t(b) - t(a) : t(a) - t(b)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, fase, categoria, urg, busca, ordem])

  const pend = todos.filter((r) => faseDoRelato(r) === 'pendente')
  const base = todos.filter((r) => passa(r, 'cat'))
  const aberto = todos.find((r) => r.id === selecionado) ?? null

  // Teclado: ↑/↓ (ou k/j) percorrem a fila, Esc fecha o detalhe. Não interfere em campos de texto.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement
      if (alvo.closest('input, textarea, select, [contenteditable]')) return
      if (e.key === 'Escape') return setSelecionado(null)
      const desce = e.key === 'ArrowDown' || e.key === 'j'
      const sobe = e.key === 'ArrowUp' || e.key === 'k'
      if (!desce && !sobe) return
      e.preventDefault()
      const ids = visiveis.map((r) => r.id)
      const i = selecionado ? ids.indexOf(selecionado) : -1
      const proximo = ids[Math.min(ids.length - 1, Math.max(0, i + (desce ? 1 : -1)))]
      if (proximo) setSelecionado(proximo)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [visiveis, selecionado])

  // O relato escolhido sempre fica à vista dentro da lista.
  useEffect(() => {
    if (selecionado) document.getElementById(`ticket-${selecionado}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selecionado])

  const aoRolar = useCallback(() => {
    const el = listaRef.current
    if (!el) return
    setRolou(el.scrollTop > 240)
    if (el.scrollTop + el.clientHeight > el.scrollHeight - 240) setLimite((l) => l + 30)
  }, [])

  function filtrar(f: FaseFiltro, u: Urgencia) {
    setFase(f)
    setUrg(u)
    setCategoria('todas')
    setSelecionado(null)
    setLimite(30)
  }

  return (
    <CentralShell kicker="Central de relatos" titulo="O que a cidade está pedindo" sub="Os relatos da cidade inteira, do mais urgente ao menos. Clique num relato para ver tudo e responder sem sair daqui.">
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard indice={0} tom="vermelho" icone="alerta" valor={<CountUp valor={pend.length} />} rotulo="sem resposta" frase="esperando o órgão" ativo={fase === 'pendente' && urg === 'todas'} onClick={() => filtrar('pendente', 'todas')} />
        <KpiCard indice={1} tom="amarelo" icone="chama" valor={<CountUp valor={pend.filter((r) => nivelRepercussao(r.repercussao) === 'alta').length} />} rotulo="alta repercussão" frase="a vizinhança apoiou" ativo={fase === 'pendente' && urg === 'alta'} onClick={() => filtrar('pendente', 'alta')} />
        <KpiCard indice={2} tom="azul" icone="relogio" valor={<CountUp valor={pend.filter((r) => diasDesde(r.created_at) > 7).length} />} rotulo="há mais de 7 dias" frase="sem ninguém responder" onClick={() => { filtrar('pendente', 'todas'); setOrdem('antigos') }} />
        <KpiCard indice={3} tom="verde" icone="check" valor={<CountUp valor={todos.filter((r) => faseDoRelato(r) === 'concluido').length} />} rotulo="encerrados" frase="resolvidos ou virando projeto" ativo={fase === 'concluido'} onClick={() => filtrar('concluido', 'todas')} />
      </div>

      {/* Filtros */}
      <div className="mt-6 rounded-[28px] bg-white p-4 shadow-[0_2px_8px_-4px_rgba(27,24,19,0.12)] ring-1 ring-grafite-200 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Situação" className="flex flex-wrap gap-1 rounded-full bg-grafite-100 p-1">
            {FASES.map((f) => {
              const ativo = fase === f.valor
              const qtd = contar('fase', (r) => f.valor === 'todos' || faseDoRelato(r) === f.valor)
              return (
                <button key={f.valor} type="button" role="radio" aria-checked={ativo} onClick={() => { setFase(f.valor); setSelecionado(null) }} className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${ativo ? 'text-grafite-900' : 'text-grafite-500 hover:text-grafite-900'}`}>
                  {ativo && <motion.span layoutId="fase-central" className="absolute inset-0 rounded-full bg-white shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative">
                    {f.rotulo} <span className="text-grafite-500">{qtd}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="relative min-w-[200px] flex-1">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-grafite-500" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por bairro ou palavra" aria-label="Buscar relatos" className="w-full rounded-full border border-grafite-200 bg-grafite-50 py-2.5 pl-10 pr-4 text-sm text-grafite-900 placeholder:text-grafite-500 focus:border-amarelo-500 focus:outline-none focus:ring-4 focus:ring-amarelo-500/20" />
          </div>
          <div role="radiogroup" aria-label="Ordenar" className="flex items-center gap-1 text-xs text-grafite-500">
            Ordenar
            {ORDENS.map((o) => (
              <button key={o.valor} type="button" role="radio" aria-checked={ordem === o.valor} onClick={() => setOrdem(o.valor)} className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${ordem === o.valor ? 'bg-grafite-900 text-white' : 'text-grafite-700 hover:bg-grafite-100'}`}>
                {o.rotulo}
              </button>
            ))}
          </div>
        </div>

        {/* Categorias */}
        <div role="radiogroup" aria-label="Categoria" className="mt-4 flex flex-wrap gap-2">
          <ChipFiltro ativo={categoria === 'todas'} onClick={() => setCategoria('todas')} qtd={contar('cat', () => true)}>
            Todas
          </ChipFiltro>
          {CATEGORIAS.map((c) => {
            const qtd = contar('cat', (r) => r.categoria === c.value)
            const cor = rgb(CATEGORIA_RGB[c.value])
            return (
              <ChipFiltro key={c.value} ativo={categoria === c.value} desativado={qtd === 0 && categoria !== c.value} cor={cor} onClick={() => setCategoria(categoria === c.value ? 'todas' : c.value)} qtd={qtd} icone={<IconeCategoria categoria={c.value} size={14} />}>
                {c.label}
              </ChipFiltro>
            )
          })}
        </div>

        {/* Urgência */}
        <div role="radiogroup" aria-label="Urgência" className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-grafite-500">Urgência</span>
          <ChipFiltro ativo={urg === 'todas'} onClick={() => setUrg('todas')} qtd={contar('urg', () => true)}>
            Todas
          </ChipFiltro>
          {URGENCIAS.map((u) => {
            const qtd = contar('urg', (r) => nivelRepercussao(r.repercussao) === u.valor)
            return (
              <ChipFiltro key={u.valor} ativo={urg === u.valor} desativado={qtd === 0 && urg !== u.valor} cor={u.cor} onClick={() => setUrg(urg === u.valor ? 'todas' : u.valor)} qtd={qtd} ponto>
                {u.rotulo}
              </ChipFiltro>
            )
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Fila: no computador tem altura própria e rola por dentro */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:flex lg:h-[calc(100vh-6.5rem)] lg:flex-col">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-grafite-500" aria-live="polite">
              <b className="text-grafite-900">{visiveis.length}</b> {visiveis.length === 1 ? 'relato' : 'relatos'} neste recorte
            </p>
            <p className="hidden text-xs text-grafite-500 lg:block">
              <kbd className="rounded bg-grafite-100 px-1.5 py-0.5 font-mono text-[10px]">↑</kbd> <kbd className="rounded bg-grafite-100 px-1.5 py-0.5 font-mono text-[10px]">↓</kbd> navegar · <kbd className="rounded bg-grafite-100 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> fechar
            </p>
          </div>
          <div className="relative lg:min-h-0 lg:flex-1">
            <div
              ref={listaRef}
              onScroll={aoRolar}
              tabIndex={-1}
              className="rolagem-fina lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:py-1 lg:pr-2 lg:[mask-image:linear-gradient(to_bottom,transparent,black_14px,black_calc(100%-28px),transparent)]"
            >
              {relatos === null ? (
                <ul className="space-y-3" aria-busy>
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="h-32 animate-pulse rounded-[24px] bg-grafite-100" />
                  ))}
                </ul>
              ) : visiveis.length === 0 ? (
                <div className="rounded-[28px] border-2 border-dashed border-grafite-200 bg-white/60 px-6 py-14 text-center">
                  <p className="font-heading text-xl font-bold text-grafite-900">{fase === 'pendente' && urg === 'todas' && categoria === 'todas' && !busca ? 'Fila em dia' : 'Nada neste recorte'}</p>
                  <p className="mt-1 text-sm text-grafite-500">Tire um filtro para ver mais relatos.</p>
                  <button type="button" onClick={() => { setCategoria('todas'); setUrg('todas'); setBusca(''); setFase('todos') }} className="mt-4 rounded-full bg-amarelo-500 px-5 py-2 text-sm font-bold text-grafite-900">
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <ul className="space-y-3 pb-6">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {visiveis.slice(0, limite).map((r, i) => (
                      <Ticket key={r.id} relato={r} indice={i} ativo={r.id === selecionado} onAbrir={() => setSelecionado(r.id === selecionado ? null : r.id)} />
                    ))}
                  </AnimatePresence>
                  <li className="pt-1 text-center text-xs text-grafite-500">
                    {visiveis.length > limite ? (
                      <button type="button" onClick={() => setLimite((l) => l + 30)} className="rounded-full px-4 py-2 font-bold text-grafite-700 ring-1 ring-grafite-300 hover:bg-white">
                        Mostrar mais {Math.min(30, visiveis.length - limite)} ({visiveis.length - limite} restantes)
                      </button>
                    ) : (
                      'Fim da lista'
                    )}
                  </li>
                </ul>
              )}
            </div>
            <AnimatePresence>
              {rolou && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={() => listaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="absolute bottom-4 right-5 rounded-full bg-grafite-900 px-4 py-2 text-xs font-bold text-white shadow-lg"
                >
                  ↑ Voltar ao topo
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Detalhe (ou leitura da cidade) */}
        {desktop && (
          <aside className="sticky top-20 max-h-[calc(100vh-6.5rem)] overflow-y-auto rounded-[28px] [scrollbar-width:none]" aria-label="Detalhe do relato">
            <AnimatePresence mode="wait" initial={false}>
              {aberto ? (
                <DetalheRelato key={aberto.id} relato={aberto} onFechar={() => setSelecionado(null)} onStatus={definirStatus} />
              ) : (
                <motion.div key="leitura" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="rounded-[28px] bg-gradient-to-br from-amarelo-100 to-white p-6 ring-1 ring-amarelo-300/60">
                    <p className="font-heading text-2xl font-extrabold text-grafite-900">Escolha um relato</p>
                    <p className="mt-1 text-sm text-grafite-700">O detalhe abre aqui: foto, texto inteiro, números, histórico e o formulário de resposta. Enquanto isso, a leitura do recorte atual:</p>
                  </div>
                  <Painel titulo="Onde pesa mais">
                    <BarrasBairros relatos={base} />
                  </Painel>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Painel titulo="Por categoria">
                      <RoscaCategorias relatos={base} />
                    </Painel>
                    <Painel titulo="Ritmo">
                      <Sparkline relatos={todos} />
                    </Painel>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        )}
      </div>

      {/* Celular: o detalhe vira uma folha por cima */}
      <AnimatePresence>
        {!desktop && aberto && (
          <motion.div className="fixed inset-0 z-[2000] flex items-end bg-grafite-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelecionado(null)}>
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
              <DetalheRelato relato={aberto} onFechar={() => setSelecionado(null)} onStatus={definirStatus} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CentralShell>
  )
}

function ChipFiltro({ ativo, desativado, cor, qtd, icone, ponto, onClick, children }: { ativo: boolean; desativado?: boolean; cor?: string; qtd: number; icone?: ReactNode; ponto?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      disabled={desativado}
      onClick={onClick}
      style={ativo && cor ? { background: cor, borderColor: cor } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
        ativo ? (cor ? 'text-white shadow-md' : 'border-grafite-900 bg-grafite-900 text-white') : 'border-grafite-200 bg-white text-grafite-700 hover:-translate-y-0.5 hover:border-grafite-300 disabled:opacity-40 disabled:hover:translate-y-0'
      }`}
    >
      {ponto && <span className="h-2.5 w-2.5 rounded-full" style={{ background: ativo ? '#fff' : cor }} />}
      {icone && <span style={{ color: ativo ? '#fff' : cor }}>{icone}</span>}
      {children}
      <span className={`rounded-full px-1.5 text-xs tabular-nums ${ativo ? 'bg-white/25' : 'bg-grafite-100 text-grafite-500'}`}>{qtd}</span>
    </button>
  )
}

function Ticket({ relato: r, indice, ativo, onAbrir }: { relato: PostRepercussao; indice: number; ativo: boolean; onAbrir: () => void }) {
  const nivel = nivelRepercussao(r.repercussao)
  const fase = faseDoRelato(r)
  const dias = diasDesde(r.created_at)
  const categoria = CATEGORIAS.find((c) => c.value === r.categoria)?.label ?? r.categoria
  return (
    <motion.li
      id={`ticket-${r.id}`}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30, delay: Math.min(indice, 8) * 0.03 }}
    >
      <button
        type="button"
        onClick={onAbrir}
        aria-pressed={ativo}
        className={`group relative flex w-full gap-4 overflow-hidden rounded-[24px] p-4 pl-5 text-left transition-all ${
          ativo ? 'bg-amarelo-50 shadow-[0_18px_36px_-20px_rgba(27,24,19,0.5)] ring-2 ring-amarelo-500' : 'bg-white shadow-[0_2px_8px_-4px_rgba(27,24,19,0.12)] ring-1 ring-grafite-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(27,24,19,0.45)]'
        }`}
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: COR_NIVEL[nivel] }} />
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white transition-transform group-hover:-rotate-6" style={{ background: rgb(CATEGORIA_RGB[r.categoria]) }}>
          <IconeCategoria categoria={r.categoria} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <b className="text-sm text-grafite-900">{r.bairro}</b>
            <span className="text-grafite-500">{categoria}</span>
            {dias <= 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-status-verde-50 px-2 py-0.5 text-[10px] font-bold uppercase text-status-verde-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-verde-500" />
                novo
              </span>
            )}
          </span>
          <span className="mt-1 line-clamp-2 block text-[15px] leading-snug text-grafite-700">{r.descricao}</span>
          <span className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-grafite-500">
            {fase === 'pendente' ? <Chip tom={dias > 7 ? 'vermelho' : 'cinza'}>{dias <= 0 ? 'Chegou hoje' : `Sem resposta há ${dias} ${dias === 1 ? 'dia' : 'dias'}`}</Chip> : <Chip tom={fase === 'concluido' ? 'verde' : 'azul'}>{fase === 'concluido' ? 'Encerrado' : 'Em andamento'}</Chip>}
            <span>
              {r.interacoes} {r.interacoes === 1 ? 'apoio' : 'apoios'}
            </span>
            {typeof r.comentarios === 'number' && (
              <span>
                {r.comentarios} {r.comentarios === 1 ? 'comentário' : 'comentários'}
              </span>
            )}
            {r.foto_url && <span>com foto</span>}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-center justify-between gap-1">
          <AnelRepercussao valor={r.repercussao} size={44} />
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-grafite-500 transition-colors group-hover:text-grafite-900">{ativo ? 'aberto' : 'ver →'}</span>
        </span>
      </button>
    </motion.li>
  )
}
