import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { supabase } from '../../../lib/supabase'
import Pills from '../../../components/Pills'
import RelatoItem from '../components/RelatoItem'
import EmAltaCard from '../components/EmAltaCard'
import SeletorBairro from '../components/SeletorBairro'
import GavetaMobile, { type GavetaMobileHandle } from '../components/GavetaMobile'
import { useDesktop } from '../useDesktop'
import { usePerfis } from '../perfis'
import { useBairrosSeguidos } from '../useBairrosSeguidos'
import { normalizar } from '../busca'
import { nivelRepercussao } from '../../../lib/repercussao'
import { RAMPA_REPERCUSSAO, rgb } from '../cores'
import { CATEGORIAS, type Categoria, type PostRepercussao } from '../../../types/database'

gsap.registerPlugin(useGSAP, SplitText)

// O mapa 3D (MapLibre + deck.gl) é pesado: só é baixado quando o Feed abre.
const MapaVivo = lazy(() => import('../components/MapaVivo'))

const reduzirMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Feed — Tarefa 2.5 do João (listagem real + filtros), repaginada: o mapa da
// cidade é o palco e a lista flutua por cima. Lê da view `posts_repercussao`
// (Guilherme, Tarefa 2.3) para ter a repercussão real.
export default function FeedPage() {
  const navigate = useNavigate()
  const raiz = useRef<HTMLDivElement>(null)
  const gaveta = useRef<GavetaMobileHandle>(null)
  const desktop = useDesktop()
  const contador = useRef<HTMLSpanElement>(null)
  const [posts, setPosts] = useState<PostRepercussao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas')
  const [bairro, setBairro] = useState('')
  const [destaque, setDestaque] = useState<string | null>(null)
  const [foco, setFoco] = useState<{ id: string; seq: number } | null>(null)
  const [modo3d, setModo3d] = useState(true)
  // Ao rolar a lista, o cabeçalho do painel se recolhe e devolve espaço aos cards.
  const [compacto, setCompacto] = useState(false)
  const [busca, setBusca] = useState('')
  const [soMeusBairros, setSoMeusBairros] = useState(false)
  const { bairros: seguidos, disponivel: podeSeguir, alternar: alternarBairro } = useBairrosSeguidos()
  // Instante de referência para separar "Hoje / Esta semana / Antes".
  const [agora] = useState(() => Date.now())
  const campoBusca = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function loadPosts() {
      const { data, error } = await supabase
        .from('posts_repercussao')
        .select('*')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) setError(error.message)
      else setPosts(data ?? [])
      setLoading(false)
    }
    loadPosts()
    return () => {
      cancelled = true
    }
  }, [])

  // Atalho "/" leva o cursor para a busca (como em GitHub/YouTube).
  useEffect(() => {
    const atalho = (e: globalThis.KeyboardEvent) => {
      const alvo = e.target as HTMLElement
      if (e.key !== '/' || alvo.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      campoBusca.current?.focus()
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  const bairros = useMemo(() => {
    const contagem = new Map<string, number>()
    for (const p of posts) contagem.set(p.bairro, (contagem.get(p.bairro) ?? 0) + 1)
    return Array.from(contagem, ([nome, total]) => ({ bairro: nome, total })).sort((a, b) =>
      a.bairro.localeCompare(b.bairro, 'pt-BR'),
    )
  }, [posts])

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    return posts.filter((p) => {
      if (categoria !== 'todas' && p.categoria !== categoria) return false
      if (bairro && p.bairro !== bairro) return false
      if (soMeusBairros && !seguidos.includes(p.bairro)) return false
      if (!termo) return true
      const rotulo = CATEGORIAS.find((c) => c.value === p.categoria)?.label ?? ''
      return normalizar(`${p.descricao} ${p.bairro} ${rotulo}`).includes(termo)
    })
  }, [posts, categoria, bairro, busca, soMeusBairros, seguidos])

  const perfis = usePerfis(posts.map((p) => p.user_id))

  // Abertura: painel desliza, o título sobe letra a letra, filtros e controles entram em sequência.
  useGSAP(
    () => {
      if (reduzirMovimento()) return
      const titulo = SplitText.create('[data-anim="titulo"]', { type: 'chars' })
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      // No celular a gaveta controla a própria posição (arrasto); só anima a opacidade dela.
      if (desktop) tl.from('[data-anim="painel"]', { x: -48, opacity: 0, duration: 0.9 })
      else tl.from('[data-anim="painel"]', { opacity: 0, duration: 0.6 })
      tl.from(titulo.chars, { yPercent: 110, opacity: 0, stagger: 0.06, duration: 0.7 }, '-=0.55')
        .from('[data-anim="filtros"] > *', { y: 14, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.45')
        .from('[data-anim="controles"] > *', { y: -14, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.5')
      return () => titulo.revert()
    },
    { scope: raiz },
  )

  // Contador que corre até o total de relatos assim que os dados chegam.
  useGSAP(
    () => {
      const el = contador.current
      if (!el || loading) return
      const alvo = { n: 0 }
      gsap.to(alvo, {
        n: posts.length,
        duration: reduzirMovimento() ? 0 : 1.4,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = String(Math.round(alvo.n))
        },
      })
    },
    { dependencies: [loading, posts.length], scope: raiz },
  )

  // O mais repercutido do filtro atual vira o destaque "Em alta" (se passar do limiar de média).
  const emAlta = useMemo(() => {
    const topo = filtrados.reduce<PostRepercussao | null>(
      (melhor, p) => (!melhor || p.repercussao > melhor.repercussao ? p : melhor),
      null,
    )
    return topo && nivelRepercussao(topo.repercussao) !== 'baixa' ? topo : null
  }, [filtrados])

  const grupos = useMemo(() => {
    const resto = filtrados.filter((p) => p.id !== emAlta?.id)
    const idadeDias = (p: PostRepercussao) => (agora - new Date(p.created_at).getTime()) / 86_400_000
    return [
      { titulo: 'Hoje', itens: resto.filter((p) => idadeDias(p) < 1) },
      { titulo: 'Esta semana', itens: resto.filter((p) => idadeDias(p) >= 1 && idadeDias(p) < 7) },
      { titulo: 'Antes', itens: resto.filter((p) => idadeDias(p) >= 7) },
    ].filter((g) => g.itens.length > 0)
  }, [filtrados, emAlta, agora])

  const verNoMapa = (id: string) => setFoco((f) => ({ id, seq: (f?.seq ?? 0) + 1 }))

  const pillOptions = [{ value: 'todas' as const, label: 'Todas' }, ...CATEGORIAS]


  const verNoMapaEMostrar = (id: string) => {
    verNoMapa(id)
    if (!desktop) gaveta.current?.irPara('baixa')
  }

  const titulo = (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-grafite-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-verde-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-verde-500" />
          </span>
          Recife agora
        </div>
        <h1
          data-anim="titulo"
          className="mt-1.5 overflow-hidden font-heading text-4xl lg:text-5xl font-extrabold leading-none text-grafite-900"
        >
          Feed
        </h1>
      </div>
      <div className="flex items-end gap-3">
        <p className="text-right leading-tight">
          <span ref={contador} className="font-heading text-3xl lg:text-4xl font-extrabold text-amarelo-700">
            0
          </span>
          <span className="block text-[11px] lg:text-xs text-grafite-500">relatos na cidade</span>
        </p>
        {!desktop && (
          <Link
            to="/feed/novo"
            aria-label="Relatar problema"
            className="mb-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-amarelo-500 text-2xl font-semibold leading-none text-grafite-900 shadow-[0_10px_22px_-10px_rgba(245,184,0,0.9)] active:scale-95"
          >
            +
          </Link>
        )}
      </div>
    </div>
  )

  const campoDeBusca = (
    <label className="group relative flex items-center">
      <span className="sr-only">Buscar relatos</span>
      <svg
        viewBox="0 0 24 24"
        width={18}
        height={18}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
        className="pointer-events-none absolute left-4 text-grafite-500 transition-colors group-focus-within:text-amarelo-700"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.2-4.2" strokeLinecap="round" />
      </svg>
      <input
        ref={campoBusca}
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setBusca('')}
        onFocus={() => !desktop && gaveta.current?.irPara('cheia')}
        placeholder="Buscar por problema, rua ou bairro"
        className="w-full rounded-full border border-grafite-200 bg-white py-3 pl-11 pr-14 text-base lg:text-sm text-grafite-900 shadow-[0_2px_8px_-4px_rgba(27,24,19,0.15)] transition-[border-color,box-shadow] placeholder:text-grafite-500 focus:border-amarelo-500 focus:shadow-[0_0_0_4px_rgba(245,184,0,0.18)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <AnimatePresence mode="wait" initial={false}>
        {busca ? (
          <motion.button
            key="limpar"
            type="button"
            onClick={() => {
              setBusca('')
              campoBusca.current?.focus()
            }}
            aria-label="Limpar busca"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full bg-grafite-200 text-grafite-700 hover:bg-amarelo-500 hover:text-grafite-900"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </motion.button>
        ) : (
          desktop && (
            <motion.kbd
              key="atalho"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute right-4 rounded-md border border-grafite-200 bg-grafite-50 px-1.5 py-0.5 font-body text-[11px] font-semibold text-grafite-500"
            >
              /
            </motion.kbd>
          )
        )}
      </AnimatePresence>
    </label>
  )

  const categorias = (
    <div className="-mx-6 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&>div]:w-max [&>div]:flex-nowrap">
      <Pills options={pillOptions} value={categoria} onChange={setCategoria} layoutId="feed-categoria-pill" />
    </div>
  )

  const barraContagem = (
    <div className="relative z-20 flex items-center justify-between gap-3 border-t border-grafite-200/70 px-6 py-2.5 text-xs text-grafite-500">
      <span className="min-w-0 truncate">
        <motion.span
          key={filtrados.length}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-block font-semibold text-grafite-900"
        >
          {filtrados.length}
        </motion.span>{' '}
        {filtrados.length === 1 ? 'relato' : 'relatos'}
        {busca.trim() && ` para "${busca.trim()}"`}
      </span>
      <span className="flex items-center gap-1.5">
        {podeSeguir && seguidos.length > 0 && !bairro && (
          <button
            type="button"
            onClick={() => setSoMeusBairros((v) => !v)}
            aria-pressed={soMeusBairros}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              soMeusBairros
                ? 'border-amarelo-500 bg-amarelo-500 text-grafite-900'
                : 'border-grafite-200 bg-white text-grafite-900 hover:border-amarelo-500'
            }`}
          >
            Meus bairros · {seguidos.length}
          </button>
        )}
        {podeSeguir && bairro && (
          <motion.button
            type="button"
            onClick={() => alternarBairro(bairro)}
            aria-pressed={seguidos.includes(bairro)}
            whileTap={{ scale: 0.94 }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              seguidos.includes(bairro)
                ? 'border-amarelo-500 bg-amarelo-500 text-grafite-900'
                : 'border-grafite-200 bg-white text-grafite-900 hover:border-amarelo-500'
            }`}
          >
            {seguidos.includes(bairro) ? '✓ Seguindo' : '+ Seguir'}
          </motion.button>
        )}
        <SeletorBairro opcoes={bairros} totalGeral={posts.length} value={bairro} onChange={setBairro} />
      </span>
    </div>
  )

  const lista = (
    <div
      className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 lg:pb-5 [scrollbar-color:#cfcbc0_transparent] [scrollbar-width:thin]"
      onScroll={(e) => setCompacto(e.currentTarget.scrollTop > 24)}
    >
      {error ? (
        <p className="m-3 rounded-2xl bg-status-vermelho-50 p-4 text-sm text-status-vermelho-700">
          Não foi possível carregar os relatos: {error}. Confira se o <code>.env.local</code> tem as chaves do Supabase.
        </p>
      ) : loading ? (
        <ul className="space-y-2 p-1">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </ul>
      ) : filtrados.length === 0 ? (
        <p className="m-3 text-sm text-grafite-700">
          {posts.length === 0
            ? 'Nenhum relato ainda. Seja o primeiro a publicar.'
            : busca.trim()
              ? `Nada encontrado para "${busca.trim()}". Tente outra palavra ou limpe os filtros.`
              : 'Nenhum relato com esses filtros. Troque a categoria ou o bairro.'}
        </p>
      ) : (
        <div className="space-y-5 pt-1">
          <AnimatePresence mode="popLayout">
            {emAlta && (
              <EmAltaCard
                key={`em-alta-${emAlta.id}`}
                post={emAlta}
                ativo={destaque === emAlta.id}
                onHover={setDestaque}
                onVerNoMapa={verNoMapaEMostrar}
                busca={busca}
              />
            )}
          </AnimatePresence>
          {grupos.map((grupo) => (
            <section key={grupo.titulo}>
              <h2 className="sticky top-0 z-10 -mx-4 mb-2 flex items-center gap-3 bg-grafite-50/90 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-grafite-500 backdrop-blur">
                {grupo.titulo}
                <span className="h-px flex-1 bg-grafite-200" />
                <span className="font-semibold normal-case tracking-normal">{grupo.itens.length}</span>
              </h2>
              <ul className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {grupo.itens.map((post) => (
                    <RelatoItem
                      key={post.id}
                      post={post}
                      ativo={destaque === post.id}
                      onHover={setDestaque}
                      onVerNoMapa={verNoMapaEMostrar}
                      busca={busca}
                      perfil={post.user_id ? perfis.get(post.user_id) : undefined}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div ref={raiz} className="relative h-[calc(100dvh-57px)] overflow-hidden bg-grafite-200">
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-grafite-500">Carregando mapa…</div>
          }
        >
          <MapaVivo
            posts={filtrados}
            ativoId={destaque}
            foco={foco}
            modo3d={modo3d}
            onHover={setDestaque}
            onSelect={(id) => navigate(`/feed/${id}`)}
          />
        </Suspense>
      </div>

      {desktop ? (
        <aside
          data-anim="painel"
          className="absolute z-10 left-5 top-5 bottom-5 w-[470px] flex flex-col overflow-hidden rounded-[28px] border border-white/70 bg-grafite-50/85 shadow-[0_30px_70px_-25px_rgba(27,24,19,0.45)] backdrop-blur-xl"
        >
          <header className="px-6 pt-6 pb-4">
            {titulo}
            <motion.p
              initial={false}
              animate={compacto ? { height: 0, opacity: 0, marginTop: 0 } : { height: 'auto', opacity: 1, marginTop: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden text-sm text-grafite-700"
            >
              Problemas relatados pela cidade. As colunas sobem onde a repercussão é maior.
            </motion.p>
            <div data-anim="filtros" className="mt-4 space-y-3">
              {campoDeBusca}
              {categorias}
            </div>
          </header>
          {barraContagem}
          {lista}
        </aside>
      ) : (
        <GavetaMobile
          ref={gaveta}
          topo={
            <div className="px-5 pb-3">
              {titulo}
              <div data-anim="filtros" className="mt-3">
                {campoDeBusca}
              </div>
            </div>
          }
        >
          <div className="px-6 pb-2">{categorias}</div>
          {barraContagem}
          {lista}
        </GavetaMobile>
      )}

      <div data-anim="controles" className="absolute right-3 top-3 lg:right-4 lg:top-4 z-10 flex flex-col items-end gap-2">
        <div
          role="radiogroup"
          aria-label="Visualização do mapa"
          className="flex rounded-full border border-white/70 bg-grafite-50/90 p-1 shadow-lg backdrop-blur"
        >
          {[
            { valor: true, rotulo: '3D' },
            { valor: false, rotulo: '2D' },
          ].map((opcao) => (
            <button
              key={opcao.rotulo}
              type="button"
              role="radio"
              aria-checked={modo3d === opcao.valor}
              onClick={() => setModo3d(opcao.valor)}
              className="relative px-4 py-1.5 text-sm font-bold text-grafite-900"
            >
              {modo3d === opcao.valor && (
                <motion.span
                  layoutId="feed-modo-mapa"
                  className="absolute inset-0 rounded-full bg-amarelo-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{opcao.rotulo}</span>
            </button>
          ))}
        </div>
        {desktop && (
          <div className="rounded-2xl border border-white/70 bg-grafite-50/90 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-xs font-semibold text-grafite-900">Repercussão por área</p>
            <div
              className="mt-2 h-2 w-44 rounded-full"
              style={{ background: `linear-gradient(90deg, ${RAMPA_REPERCUSSAO.map(rgb).join(', ')})` }}
            />
            <div className="mt-1 flex justify-between text-[11px] text-grafite-500">
              <span>baixa</span>
              <span>alta</span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
