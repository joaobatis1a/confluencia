import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CONTAS_DEMO, SENHA_DEMO } from '../../lib/contasDemo'
import Marquee from '../../components/Marquee'
import Contador from '../../components/Contador'
import { MOCK_PROJETOS } from '../../features/projetos/mock'
import { FOTOS_PROJETO } from '../../features/projetos/fotos'
import { CONTEUDO_PROJETO } from '../../features/projetos/conteudo'
import type { Categoria } from '../../types/database'
import Preloader from './Preloader'
import HeroPortal, { type RelatoVitrine } from './HeroPortal'
import Manifesto from './Manifesto'
import ComoFunciona from './ComoFunciona'
import AntesDepois from './AntesDepois'
import Magnetico from './Magnetico'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

const CHAVE_ABERTURA = 'confluencia:abertura-vista'

function jaViuAbertura() {
  try {
    return sessionStorage.getItem(CHAVE_ABERTURA) === '1'
  } catch {
    return true
  }
}

// Relatos de teste ("[SEED] ...", "Teste de QA ...") e textos sem frase de
// verdade não vão para a vitrine.
const ehVitrine = (d: string) =>
  !d.startsWith('[') && !/teste|automa[cç][aã]o/i.test(d) && d.trim().split(/\s+/).length >= 5

// Landing do Confluência: apresenta o sistema e leva para dentro dele (/feed).
// Referência de linguagem: landonorris.com — abertura com contador, letra
// enorme, serifa itálica, rolagem que conta uma história.
export default function LandingPage() {
  const [abertura, setAbertura] = useState(() => !jaViuAbertura())
  const [relatos, setRelatos] = useState<RelatoVitrine[]>([])
  const [carregou, setCarregou] = useState(false)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('posts_repercussao')
      .select('id, categoria, bairro, descricao, interacoes, latitude, longitude')
      .order('interacoes', { ascending: false })
      .then(({ data }) => {
        if (cancelado) return
        setRelatos(
          (data ?? []).map((r) => ({
            id: r.id as string,
            categoria: r.categoria as Categoria,
            bairro: r.bairro as string,
            descricao: r.descricao as string,
            interacoes: (r.interacoes as number) ?? 0,
            latitude: r.latitude as number,
            longitude: r.longitude as number,
          })),
        )
        setCarregou(true)
      })
    return () => {
      cancelado = true
    }
  }, [])

  // Imagens e fontes mudam a altura da página: recalcula as seções presas.
  useEffect(() => {
    const recalcular = () => ScrollTrigger.refresh()
    window.addEventListener('load', recalcular)
    document.fonts?.ready.then(recalcular)
    return () => window.removeEventListener('load', recalcular)
  }, [])

  function fimAbertura() {
    try {
      sessionStorage.setItem(CHAVE_ABERTURA, '1')
    } catch {
      // sem sessionStorage: a abertura só não é lembrada
    }
    setAbertura(false)
  }

  const vitrine = relatos.filter((r) => ehVitrine(r.descricao))
  const totais = {
    relatos: relatos.length,
    apoios: relatos.reduce((s, r) => s + r.interacoes, 0),
    bairros: new Set(relatos.map((r) => r.bairro)).size,
  }
  const frases = vitrine
    .slice(0, 8)
    .map((r) => `${r.bairro} — ${r.descricao.length > 56 ? `${r.descricao.slice(0, 56)}…` : r.descricao}`)

  return (
    <div className="overflow-x-clip bg-grafite-50">
      <AnimatePresence>{abertura && <Preloader onFim={fimAbertura} />}</AnimatePresence>
      <NavLanding />

      <HeroPortal relatos={vitrine} totais={totais} pronto={!abertura} />

      {/* Duas faixas cruzadas, como fitas coladas na página */}
      <div className="relative z-10 -my-6 py-14">
        <div className="-mx-10 -rotate-[2.5deg] border-y-2 border-grafite-900 bg-amarelo-500 py-4">
          <Marquee
            itens={frases.length ? frases : ['Relate', 'Apoie', 'Vote', 'Acompanhe']}
            duracao={45}
            className="font-heading text-xl font-extrabold uppercase tracking-tight text-grafite-900 sm:text-3xl"
          />
        </div>
        <div className="-mx-10 -mt-3 rotate-[1.8deg] border-y-2 border-grafite-900 bg-white py-3">
          <Marquee
            itens={['Relate', 'Apoie', 'Vote', 'Acompanhe', 'Recife tem voz']}
            duracao={30}
            reverso
            className="font-serif text-2xl italic text-grafite-900 sm:text-4xl"
          />
        </div>
      </div>

      <Manifesto />

      <ComoFunciona />

      <AntesDepois />

      <Numeros totais={totais} carregou={carregou} />

      <Colagem />

      <FormasDeEntrar />

      <Final />
    </div>
  )
}

// Barra da landing: some ao descer, volta ao subir.
function NavLanding() {
  const { scrollY } = useScroll()
  const [escondida, setEscondida] = useState(false)
  const [solida, setSolida] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => {
    const anterior = scrollY.getPrevious() ?? 0
    setEscondida(v > anterior && v > 200)
    setSolida(v > 40)
  })
  const { user } = useAuth()

  return (
    <motion.header
      animate={{ y: escondida ? -90 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      className="fixed inset-x-0 top-0 z-[1000] px-3 pt-3"
    >
      <div
        className={`mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full pl-3 pr-2 transition-[background-color,box-shadow] duration-300 ${
          solida ? 'bg-white/80 shadow-[0_10px_30px_-18px_rgba(27,24,19,0.5)] backdrop-blur-xl' : ''
        }`}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <motion.img src="/logo.png" alt="" className="h-9 w-9" whileHover={{ rotate: -14 }} />
          <span className="font-heading text-lg font-extrabold text-grafite-900">Confluência</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-semibold text-grafite-900 md:flex">
          {[
            { href: '#como-funciona', rotulo: 'Como funciona' },
            { href: '/projetos', rotulo: 'Projetos' },
            { href: '/feed', rotulo: 'Mapa da cidade' },
          ].map((l) =>
            l.href.startsWith('#') ? (
              <a key={l.href} href={l.href} className="rounded-full px-4 py-2 transition-colors hover:bg-amarelo-100">
                {l.rotulo}
              </a>
            ) : (
              <Link key={l.href} to={l.href} className="rounded-full px-4 py-2 transition-colors hover:bg-amarelo-100">
                {l.rotulo}
              </Link>
            ),
          )}
        </nav>
        <Link
          to={user ? '/feed' : '/entrar'}
          className="rounded-full bg-amarelo-500 px-5 py-2.5 text-sm font-bold text-grafite-900 transition-transform hover:-translate-y-0.5"
        >
          {user ? 'Abrir o app' : 'Entrar'}
        </Link>
      </div>
    </motion.header>
  )
}

// Números ao vivo, enormes, cada um com sua frase em serifa.
function Numeros({ totais, carregou }: { totais: { relatos: number; apoios: number; bairros: number }; carregou: boolean }) {
  const projetos = MOCK_PROJETOS.filter((p) => p.status !== 'rejeitado').length
  const itens = [
    { valor: totais.relatos, rotulo: 'relatos', frase: 'apontados no mapa' },
    { valor: totais.apoios, rotulo: 'apoios', frase: 'de vizinhos que concordam' },
    { valor: totais.bairros, rotulo: 'bairros', frase: 'com alguém de olho' },
    { valor: projetos, rotulo: 'projetos', frase: 'para acompanhar até a entrega' },
  ]
  return (
    <section className="bg-grafite-50 px-[4vw] py-[16vh]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="font-heading text-[clamp(2.6rem,6vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.03em] text-grafite-900">
          Agora, <span className="font-serif font-normal italic text-amarelo-700">no Recife</span>
        </h2>
        <p className="flex items-center gap-2 text-sm text-grafite-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-status-verde-500" />
          {carregou ? 'lido do banco agora mesmo' : 'lendo o banco…'}
        </p>
      </div>
      <dl className="mt-14 grid border-t-2 border-grafite-900 sm:grid-cols-2 lg:grid-cols-4">
        {itens.map((n, i) => (
          <motion.div
            key={n.rotulo}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            className="group relative overflow-hidden border-b border-grafite-200 py-8 sm:pr-6 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:[&:not(:first-child)]:pl-6"
          >
            <span className="absolute inset-x-0 bottom-0 h-0 bg-amarelo-500 transition-[height] duration-500 ease-out group-hover:h-full" />
            <div className="relative">
              <dt className="text-xs font-bold uppercase tracking-[0.2em] text-grafite-500">{n.rotulo}</dt>
              <dd className="mt-3 font-heading text-[clamp(5rem,9vw,9rem)] font-extrabold leading-[0.85] tracking-[-0.04em] text-grafite-900">
                <Contador valor={n.valor} />
              </dd>
              <dd className="mt-3 font-serif text-xl italic text-grafite-700">{n.frase}</dd>
            </div>
          </motion.div>
        ))}
      </dl>
    </section>
  )
}

// Final: a frase, o botão e o nome enorme ocupando a largura da tela.
function Final() {
  const caixa = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const nome = SplitText.create('[data-nome]', { type: 'chars', mask: 'chars' })
      gsap.from(nome.chars, {
        yPercent: 110,
        stagger: 0.04,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-nome]', start: 'top 95%' },
      })
      return () => nome.revert()
    },
    { scope: caixa },
  )

  return (
    <section ref={caixa} className="relative overflow-hidden bg-amarelo-500 pt-[14vh]">
      <div className="px-[4vw]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <h2 className="max-w-4xl font-heading text-[clamp(2.6rem,6.5vw,6.5rem)] font-extrabold leading-[0.92] tracking-[-0.03em] text-grafite-900">
            A cidade é <span className="font-serif font-normal italic">de quem mora nela.</span>
          </h2>
          <Magnetico>
            <Link
              to="/feed"
              className="group flex h-40 w-40 flex-col items-center justify-center rounded-full bg-white text-center font-bold text-grafite-900 shadow-[0_24px_50px_-20px_rgba(27,24,19,0.5)] transition-transform duration-300 hover:scale-105 sm:h-48 sm:w-48"
            >
              <span className="text-3xl transition-transform duration-300 group-hover:rotate-[-45deg]">→</span>
              <span className="mt-1 text-sm">
                Entrar no
                <br />
                Confluência
              </span>
            </Link>
          </Magnetico>
        </div>
        <div className="mt-[10vh] flex flex-wrap items-center justify-between gap-3 border-t-2 border-grafite-900 pt-5 text-sm text-grafite-900">
          <span>Projeto acadêmico · Recife, 2026 · Licença MIT</span>
          <span>João Batista · Ana Beatriz · Guilherme Araújo</span>
        </div>
      </div>
      <p
        data-nome
        aria-hidden
        className="mt-4 select-none whitespace-nowrap text-center font-heading text-[18.6vw] font-extrabold leading-[0.78] tracking-[-0.06em] text-grafite-900"
      >
        Confluência
      </p>
    </section>
  )
}

// Colagem de fotos da cidade com legenda de lugar; cada uma anda numa
// velocidade diferente ao rolar e ganha cor no hover.
function Colagem() {
  const secao = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: secao, offset: ['start end', 'end start'] })
  const rapido = useTransform(scrollYProgress, [0, 1], [60, -60])
  const lento = useTransform(scrollYProgress, [0, 1], [24, -24])
  const reverso = useTransform(scrollYProgress, [0, 1], [-30, 40])

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
      classe: 'lg:col-span-3 h-64',
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
        <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-12">
          {fotos.map((f) => (
            <motion.figure key={f.url} style={{ y: f.y }} className={`group ${f.classe}`}>
              <div className="h-full overflow-hidden rounded-[24px] bg-grafite-200">
                <img
                  src={f.url}
                  alt={f.local}
                  loading="lazy"
                  className="h-full w-full object-cover transition-[filter,transform] duration-700 group-hover:scale-105 lg:grayscale lg:group-hover:grayscale-0"
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
