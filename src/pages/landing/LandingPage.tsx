import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CONTAS_DEMO, SENHA_DEMO } from '../../lib/contasDemo'
import Marquee from '../../components/Marquee'
import Contador from '../../components/Contador'
import Topografia from '../../components/Topografia'
import { MOCK_PROJETOS } from '../../features/projetos/mock'
import { FOTOS_PROJETO } from '../../features/projetos/fotos'
import { CONTEUDO_PROJETO } from '../../features/projetos/conteudo'
import Preloader from './Preloader'
import HeroLanterna from './HeroLanterna'
import ComoFunciona from './ComoFunciona'

gsap.registerPlugin(useGSAP, SplitText)

interface Resumo {
  relatos: number
  apoios: number
  bairros: number
  frases: string[]
}

const CHAVE_ABERTURA = 'confluencia:abertura-vista'

function jaViuAbertura() {
  try {
    return sessionStorage.getItem(CHAVE_ABERTURA) === '1'
  } catch {
    return true
  }
}

// Landing do Confluência: apresenta o sistema e leva para dentro dele (/feed).
// Referência de linguagem: landonorris.com — abertura com contador, mistura de
// serifa itálica com letra pesada, colagem de fotos com legenda e parallax.
export default function LandingPage() {
  const [abertura, setAbertura] = useState(() => !jaViuAbertura())
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('posts_repercussao')
      .select('bairro, descricao, interacoes')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelado || !data) return
        setResumo({
          relatos: data.length,
          apoios: data.reduce((s, r) => s + (r.interacoes ?? 0), 0),
          bairros: new Set(data.map((r) => r.bairro)).size,
          frases: data
            .filter((r) => !r.descricao.startsWith('['))
            .slice(0, 8)
            .map((r) => `${r.bairro} — ${r.descricao.length > 60 ? `${r.descricao.slice(0, 60)}…` : r.descricao}`),
        })
      })
    return () => {
      cancelado = true
    }
  }, [])

  function fimAbertura() {
    try {
      sessionStorage.setItem(CHAVE_ABERTURA, '1')
    } catch {
      // sem sessionStorage: a abertura só não é lembrada
    }
    setAbertura(false)
  }

  useGSAP(
    () => {
      if (abertura || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const titulo = SplitText.create('[data-hero-titulo]', { type: 'lines,words', mask: 'lines' })
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .from(titulo.words, { yPercent: 110, duration: 1.1, stagger: 0.07 })
        .from('[data-hero-sub]', { y: 20, opacity: 0, stagger: 0.12, duration: 0.8 }, '-=0.6')
      return () => titulo.revert()
    },
    { scope: raiz, dependencies: [abertura] },
  )

  const projetosPublicos = MOCK_PROJETOS.filter((p) => p.status !== 'rejeitado')

  return (
    <div ref={raiz} className="bg-grafite-50">
      <AnimatePresence>{abertura && <Preloader onFim={fimAbertura} />}</AnimatePresence>
      <NavLanding />

      {/* TOPO ------------------------------------------------------------ */}
      <HeroLanterna>
        <div className="mx-auto max-w-7xl px-6 pb-16 sm:px-10 sm:pb-20">
          <p data-hero-sub className="text-xs font-bold uppercase tracking-[0.24em] text-amarelo-300">
            Recife · plataforma cívica
          </p>
          <h1
            data-hero-titulo
            className="mt-4 max-w-5xl font-heading text-[clamp(3.2rem,9vw,8.5rem)] font-extrabold leading-[0.9] tracking-tight"
          >
            Sua cidade <span className="font-serif font-normal italic text-amarelo-500">tem voz.</span>
          </h1>
          <p data-hero-sub className="mt-6 max-w-xl text-lg text-white/80 sm:text-xl">
            Relate problemas, apoie vizinhos, vote nos projetos da cidade e acompanhe cada obra até a entrega — tudo num
            mapa vivo do Recife.
          </p>
          <div data-hero-sub className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/feed"
              className="group inline-flex items-center gap-2 rounded-full bg-amarelo-500 px-7 py-4 text-base font-bold text-grafite-900 shadow-[0_18px_40px_-14px_rgba(245,184,0,0.8)] transition-transform hover:-translate-y-1"
            >
              Entrar no Confluência
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center rounded-full border border-white/30 px-7 py-4 text-base font-bold text-white backdrop-blur transition-colors hover:border-white/70"
            >
              Ver como funciona
            </a>
          </div>
        </div>
      </HeroLanterna>

      {/* RELATOS REAIS CORRENDO -------------------------------------------- */}
      <div className="border-y border-grafite-900 bg-amarelo-500 py-4">
        <Marquee
          itens={resumo?.frases.length ? resumo.frases : ['Relate', 'Apoie', 'Vote', 'Acompanhe']}
          duracao={40}
          className="font-heading text-xl font-extrabold uppercase tracking-tight text-grafite-900 sm:text-2xl"
        />
      </div>

      <ComoFunciona />

      {/* NÚMEROS AO VIVO --------------------------------------------------- */}
      <section className="relative overflow-hidden bg-grafite-900 py-24 text-white">
        <Topografia semente={7.7} className="absolute inset-0 h-full w-full text-white/10" />
        <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amarelo-300">Agora, no Recife</p>
          <h2 className="mt-4 max-w-3xl font-heading text-5xl font-extrabold leading-[0.95] sm:text-6xl">
            Números que se mexem <span className="font-serif font-normal italic text-amarelo-500">de verdade</span>
          </h2>
          <dl className="mt-14 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { valor: resumo?.relatos ?? 0, rotulo: 'relatos na cidade' },
              { valor: resumo?.apoios ?? 0, rotulo: 'apoios de vizinhos' },
              { valor: resumo?.bairros ?? 0, rotulo: 'bairros com relatos' },
              { valor: projetosPublicos.length, rotulo: 'projetos acompanháveis' },
            ].map((n) => (
              <div key={n.rotulo} className="border-t border-white/20 pt-6">
                <dd className="font-heading text-6xl font-extrabold text-amarelo-500 sm:text-7xl">
                  <Contador valor={n.valor} />
                </dd>
                <dt className="mt-2 text-white/70">{n.rotulo}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-10 text-xs text-white/40">Dados lidos do banco do Confluência no momento em que você abriu a página.</p>
        </div>
      </section>

      <Colagem />

      <FormasDeEntrar />

      {/* CHAMADO FINAL --------------------------------------------------- */}
      <section className="relative overflow-hidden bg-amarelo-500 py-28">
        <Topografia semente={2.2} className="absolute inset-0 h-full w-full text-grafite-900/10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center sm:px-10">
          <motion.img
            src="/logo.png"
            alt=""
            className="mx-auto h-20 w-20"
            whileInView={{ rotate: [0, -12, 0] }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          />
          <h2 className="mt-8 font-heading text-[clamp(3rem,8vw,7rem)] font-extrabold leading-[0.9] text-grafite-900">
            A cidade é <span className="font-serif font-normal italic">de quem mora nela.</span>
          </h2>
          <Link
            to="/feed"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-grafite-900 px-8 py-4 text-lg font-bold text-amarelo-300 transition-transform hover:-translate-y-1"
          >
            Entrar no Confluência →
          </Link>
        </div>
      </section>

      <footer className="bg-grafite-50 px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-grafite-500">
          <span className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-7 w-7" />
            <b className="font-heading text-grafite-900">Confluência</b> · projeto acadêmico · Recife, 2026
          </span>
          <span>João Batista · Ana Beatriz · Guilherme Araújo · Licença MIT</span>
        </div>
      </footer>
    </div>
  )
}

// Barra da landing: transparente sobre a foto, ganha fundo ao rolar.
function NavLanding() {
  const { scrollY } = useScroll()
  const [solida, setSolida] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setSolida(v > 80))
  const { user } = useAuth()

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[1000] transition-colors duration-300 ${
        solida ? 'border-b border-grafite-200 bg-grafite-50/90 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-9 w-9" />
          <span className={`font-heading text-lg font-extrabold ${solida ? 'text-grafite-900' : 'text-white'}`}>Confluência</span>
        </Link>
        <nav className={`hidden items-center gap-7 text-sm font-semibold md:flex ${solida ? 'text-grafite-900' : 'text-white'}`}>
          <a href="#como-funciona" className="hover:opacity-70">
            Como funciona
          </a>
          <Link to="/projetos" className="hover:opacity-70">
            Projetos
          </Link>
          <Link to="/feed" className="hover:opacity-70">
            Mapa da cidade
          </Link>
        </nav>
        <Link
          to={user ? '/feed' : '/entrar'}
          className="rounded-full bg-amarelo-500 px-5 py-2.5 text-sm font-bold text-grafite-900 transition-transform hover:-translate-y-0.5"
        >
          {user ? 'Abrir o app' : 'Entrar'}
        </Link>
      </div>
    </header>
  )
}

// Colagem de fotos da cidade com legenda de lugar; cada uma anda numa
// velocidade diferente ao rolar e ganha cor no hover.
function Colagem() {
  const secao = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: secao, offset: ['start end', 'end start'] })
  const rapido = useTransform(scrollYProgress, [0, 1], [120, -120])
  const lento = useTransform(scrollYProgress, [0, 1], [40, -40])
  const reverso = useTransform(scrollYProgress, [0, 1], [-60, 80])

  const fotos = [
    { ...FOTOS_PROJETO.p6, y: lento, classe: 'lg:col-span-5 lg:row-span-2 h-80 lg:h-[30rem]' },
    { ...FOTOS_PROJETO.p5, y: rapido, classe: 'lg:col-span-4 h-60 lg:mt-24' },
    { ...FOTOS_PROJETO.p1, y: reverso, classe: 'lg:col-span-3 h-56' },
    {
      url: CONTEUDO_PROJETO.p6.antesDepois!.antes.url,
      local: 'Rua dos Judeus · 1855',
      autor: 'Augusto Stahl',
      licenca: 'Domínio público',
      fonte: CONTEUDO_PROJETO.p6.antesDepois!.antes.fonte,
      y: rapido,
      classe: 'lg:col-span-3 h-64 lg:-mt-10',
    },
    { ...FOTOS_PROJETO.p4, y: lento, classe: 'lg:col-span-4 h-64' },
  ]

  return (
    <section ref={secao} className="overflow-hidden bg-grafite-50 py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amarelo-700">A cidade, de perto</p>
        <h2 className="mt-4 max-w-3xl font-heading text-5xl font-extrabold leading-[0.95] text-grafite-900 sm:text-6xl">
          Cada relato tem <span className="font-serif font-normal italic text-amarelo-700">um endereço</span>
        </h2>
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12">
          {fotos.map((f) => (
            <motion.figure key={f.url} style={{ y: f.y }} className={`group ${f.classe}`}>
              <div className="h-full overflow-hidden rounded-[24px] bg-grafite-200">
                <img
                  src={f.url}
                  alt={f.local}
                  loading="lazy"
                  className="h-full w-full object-cover grayscale transition-[filter,transform] duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
              </div>
              <figcaption className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-grafite-700">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-6 rounded-full bg-amarelo-500" />
                  {f.local}
                </span>
                <a href={f.fonte} target="_blank" rel="noreferrer" className="font-medium normal-case tracking-normal text-grafite-500 hover:underline">
                  {f.autor} · {f.licenca}
                </a>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// Três formas de conhecer o sistema: sem conta, como cidadã ou como gestor.
function FormasDeEntrar() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [entrando, setEntrando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function entrar(email: string) {
    setEntrando(email)
    setErro(null)
    const { error } = await signIn(email, SENHA_DEMO)
    setEntrando(null)
    if (error) {
      setErro('Não foi possível entrar com a conta de demonstração agora. Tente pela tela de login.')
      return
    }
    navigate('/feed')
  }

  const cartoes = [
    {
      titulo: 'Visitante',
      texto: 'Explore o mapa, os relatos e os projetos sem criar conta.',
      acao: () => navigate('/feed'),
      rotulo: 'Explorar sem conta',
      estilo: 'bg-white text-grafite-900 border border-grafite-200',
      chave: 'visitante',
    },
    {
      titulo: CONTAS_DEMO.cidada.papel,
      texto: `Entre como ${CONTAS_DEMO.cidada.nome}: relate, apoie, comente e vote.`,
      acao: () => entrar(CONTAS_DEMO.cidada.email),
      rotulo: 'Entrar como cidadã',
      estilo: 'bg-amarelo-500 text-grafite-900',
      chave: CONTAS_DEMO.cidada.email,
    },
    {
      titulo: CONTAS_DEMO.gestor.papel,
      texto: `Entre como ${CONTAS_DEMO.gestor.nome}: responda relatos e publique projetos.`,
      acao: () => entrar(CONTAS_DEMO.gestor.email),
      rotulo: 'Entrar como gestor',
      estilo: 'bg-status-azul-700 text-white',
      chave: CONTAS_DEMO.gestor.email,
    },
  ]

  return (
    <section className="bg-grafite-100 py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amarelo-700">Experimente agora</p>
        <h2 className="mt-4 max-w-3xl font-heading text-5xl font-extrabold leading-[0.95] text-grafite-900 sm:text-6xl">
          Veja o sistema <span className="font-serif font-normal italic text-amarelo-700">pelos olhos de cada um</span>
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cartoes.map((c, i) => (
            <motion.button
              key={c.chave}
              type="button"
              onClick={c.acao}
              disabled={entrando !== null}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, rotate: i === 1 ? 0 : i === 0 ? -1 : 1 }}
              className={`flex min-h-64 flex-col justify-between rounded-[32px] p-8 text-left shadow-[0_24px_50px_-30px_rgba(27,24,19,0.5)] disabled:opacity-70 ${c.estilo}`}
            >
              <span>
                <span className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">Conta {i + 1}</span>
                <span className="mt-2 block font-heading text-4xl font-extrabold">{c.titulo}</span>
                <span className="mt-3 block opacity-80">{c.texto}</span>
              </span>
              <span className="mt-8 inline-flex items-center gap-2 font-bold">
                {entrando === c.chave ? 'Entrando…' : c.rotulo} →
              </span>
            </motion.button>
          ))}
        </div>
        {erro && <p className="mt-4 text-sm text-status-vermelho-700">{erro}</p>}
      </div>
    </section>
  )
}
