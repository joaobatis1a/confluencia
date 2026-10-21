import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { FOTOS_PROJETO } from '../../features/projetos/fotos'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// Cada cena só "toca" quando o passo está na tela; ao sair e voltar, recomeça.
function useCena() {
  const ref = useRef<HTMLDivElement>(null)
  const ativo = useInView(ref, { amount: 0.6 })
  return { ref, ativo }
}

function Palco({ children, rotacao }: { children: ReactNode; rotacao: string }) {
  return (
    <div
      className={`w-[min(420px,84vw)] rounded-[32px] bg-white p-5 text-grafite-900 shadow-[0_40px_80px_-40px_rgba(27,24,19,0.55)] ring-1 ring-grafite-900/10 ${rotacao}`}
    >
      {children}
    </div>
  )
}

// 01 — o relato sendo escrito: o pino cai no mapa, o texto se digita sozinho
// e o botão publica.
const FRASE = 'Três postes apagados na Rua da Aurora. À noite o trecho fica escuro.'
function CenaRelate() {
  const { ref, ativo } = useCena()
  const [letras, setLetras] = useState(0)

  useEffect(() => {
    if (!ativo) return
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setLetras(n)
      if (n >= FRASE.length) window.clearInterval(id)
    }, 32)
    return () => {
      window.clearInterval(id)
      setLetras(0)
    }
  }, [ativo])

  const publicado = letras >= FRASE.length

  return (
    <div ref={ref}>
      <Palco rotacao="rotate-[-2deg]">
        <div className="relative h-40 overflow-hidden rounded-2xl bg-[#f3efe6]">
          <svg viewBox="0 0 400 160" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M-10 120 C 80 90, 160 140, 240 100 S 360 60, 420 80" stroke="#9fd3d6" strokeWidth="26" fill="none" />
            <g stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round">
              <path d="M30 0 L 90 160" />
              <path d="M0 50 L 400 30" />
              <path d="M180 0 L 210 160" />
              <path d="M300 0 L 280 160" />
              <path d="M0 140 L 400 150" />
            </g>
          </svg>
          <AnimatePresence>
            {ativo && (
              <motion.span
                key="pino"
                className="absolute left-[46%] top-[22%]"
                initial={{ y: -90, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.15 }}
              >
                <svg viewBox="0 0 32 42" className="h-12 w-9 drop-shadow-lg" aria-hidden>
                  <path d="M16 41S3 25.5 3 15.5a13 13 0 0 1 26 0C29 25.5 16 41 16 41Z" fill="#f5b800" stroke="#1b1813" strokeWidth="2" />
                  <circle cx="16" cy="15.5" r="5" fill="#1b1813" />
                </svg>
              </motion.span>
            )}
          </AnimatePresence>
          <span className="absolute bottom-2 left-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-grafite-700 shadow-sm">
            Boa Vista · Rua da Aurora
          </span>
        </div>

        <div className="mt-4 flex gap-1.5">
          {['Iluminação', 'Mobilidade', 'Segurança'].map((c, i) => (
            <span
              key={c}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-500 ${
                i === 0 && ativo ? 'bg-amarelo-500 text-grafite-900' : 'bg-grafite-100 text-grafite-500'
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        <p className="mt-3 min-h-[3.2rem] rounded-2xl border border-grafite-200 px-3.5 py-2.5 text-sm leading-snug">
          {FRASE.slice(0, letras)}
          {!publicado && <span className="ml-px inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-grafite-900" />}
        </p>

        <motion.span
          animate={publicado ? { scale: [1, 0.94, 1] } : { scale: 1 }}
          className={`mt-3 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-colors duration-300 ${
            publicado ? 'bg-status-verde-500 text-white' : 'bg-amarelo-500 text-grafite-900'
          }`}
        >
          {publicado ? '✓ Relato publicado no mapa' : 'Publicar relato'}
        </motion.span>
      </Palco>
    </div>
  )
}

// 02 — vizinhos chegando: os rostos se empilham, o coração bate e o contador sobe.
const VIZINHOS = [
  { i: 'M', cor: '#f5b800' },
  { i: 'J', cor: '#2f6fd6' },
  { i: 'A', cor: '#c2185b' },
  { i: 'R', cor: '#2e9d5b' },
  { i: 'L', cor: '#e07b1a' },
]
function CenaApoie() {
  const { ref, ativo } = useCena()
  const [apoios, setApoios] = useState(0)

  useEffect(() => {
    if (!ativo) return
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setApoios(n)
      if (n >= 23) window.clearInterval(id)
    }, 90)
    return () => {
      window.clearInterval(id)
      setApoios(0)
    }
  }, [ativo])

  return (
    <div ref={ref}>
      <Palco rotacao="rotate-[2deg]">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-amarelo-700">
          <span className="h-2 w-2 rounded-full bg-amarelo-500" /> Iluminação · Boa Vista
        </span>
        <p className="mt-2 font-heading text-xl font-extrabold leading-tight">Três postes apagados na Rua da Aurora</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex -space-x-2.5">
            {VIZINHOS.map((v, k) => (
              <motion.span
                key={v.i}
                initial={false}
                animate={ativo ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ delay: ativo ? 0.2 + k * 0.25 : 0, type: 'spring', stiffness: 500, damping: 20 }}
                className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white font-heading text-sm font-extrabold text-white"
                style={{ background: v.cor }}
              >
                {v.i}
              </motion.span>
            ))}
            {apoios > 5 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-10 items-center rounded-full border-[3px] border-white bg-grafite-100 px-2.5 text-xs font-bold text-grafite-700"
              >
                +{apoios - 5}
              </motion.span>
            )}
          </div>
          <motion.span
            key={apoios}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-categoria-rosa-50 px-3 py-2 font-heading text-lg font-extrabold text-categoria-rosa-700"
          >
            ♥ {apoios}
          </motion.span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-grafite-100">
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-amarelo-500 to-categoria-rosa-700"
            animate={{ scaleX: apoios / 23 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <p className="mt-2 flex justify-between text-xs text-grafite-500">
          <span>repercussão no bairro</span>
          <AnimatePresence>
            {apoios >= 23 && (
              <motion.b initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-categoria-rosa-700">
                Em alta na Boa Vista
              </motion.b>
            )}
          </AnimatePresence>
        </p>
      </Palco>
    </div>
  )
}

// 03 — a cédula: a escolha é marcada e o carimbo desce.
function CenaVote() {
  const { ref, ativo } = useCena()
  return (
    <div ref={ref}>
      <Palco rotacao="rotate-[-1.5deg]">
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-grafite-300 bg-[#fffaf0] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-grafite-500">Consulta pública · voto secreto</p>
          <p className="mt-1 font-heading text-xl font-extrabold leading-tight">Ciclofaixa na Av. Norte</p>
          <div className="mt-4 space-y-2">
            {['Sim, quero a ciclofaixa', 'Não, prefiro outra solução'].map((op, k) => (
              <div
                key={op}
                className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors duration-300 ${
                  k === 0 && ativo ? 'border-grafite-900 bg-amarelo-100' : 'border-grafite-200'
                }`}
              >
                <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 border-grafite-900">
                  {k === 0 && (
                    <svg viewBox="0 0 24 24" className="absolute h-6 w-6" aria-hidden>
                      <motion.path
                        d="M4 13l5 5L20 6"
                        fill="none"
                        stroke="#1b1813"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        initial={false}
                        animate={{ pathLength: ativo ? 1 : 0 }}
                        transition={{ delay: ativo ? 0.4 : 0, duration: 0.4 }}
                      />
                    </svg>
                  )}
                </span>
                {op}
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[11px] text-grafite-500">comprovante · 8F3A-21C7</p>

          <AnimatePresence>
            {ativo && (
              <motion.span
                key="carimbo"
                initial={{ scale: 2.6, opacity: 0, rotate: -24 }}
                animate={{ scale: 1, opacity: 1, rotate: -12 }}
                transition={{ delay: 1.1, type: 'spring', stiffness: 520, damping: 18 }}
                className="absolute bottom-5 right-4 rounded-xl border-[4px] border-status-verde-700 px-3 py-1.5 text-center font-heading text-lg font-extrabold uppercase leading-tight text-status-verde-700 mix-blend-multiply"
              >
                Voto
                <br />
                registrado
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Palco>
    </div>
  )
}

// 04 — a obra andando: as etapas se completam e chega a notificação.
const ETAPAS = ['Proposto', 'Consulta', 'Aprovado', 'Em obra', 'Entregue']
function CenaAcompanhe() {
  const { ref, ativo } = useCena()
  const [etapa, setEtapa] = useState(0)

  useEffect(() => {
    if (!ativo) return
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setEtapa(n)
      if (n >= 4) window.clearInterval(id)
    }, 550)
    return () => {
      window.clearInterval(id)
      setEtapa(0)
    }
  }, [ativo])

  return (
    <div ref={ref} className="relative">
      <Palco rotacao="rotate-[1.5deg]">
        <div className="relative h-32 overflow-hidden rounded-2xl bg-grafite-200">
          <img src={FOTOS_PROJETO.p5.url} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]">
            {ETAPAS[etapa]}
          </span>
        </div>
        <p className="mt-3 font-heading text-xl font-extrabold leading-tight">Iluminação em LED na Rua da Aurora</p>
        <ol className="mt-4 grid grid-cols-5 gap-1.5">
          {ETAPAS.map((e, k) => (
            <li key={e} className="text-center">
              <span className="block h-2 overflow-hidden rounded-full bg-grafite-100">
                <motion.span
                  className={`block h-full origin-left rounded-full ${k === etapa ? 'bg-amarelo-500' : 'bg-status-verde-500'}`}
                  initial={false}
                  animate={{ scaleX: k <= etapa ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </span>
              <span className={`mt-1.5 block text-[10px] font-semibold ${k <= etapa ? 'text-grafite-900' : 'text-grafite-300'}`}>
                {e}
              </span>
            </li>
          ))}
        </ol>
      </Palco>
      <AnimatePresence>
        {etapa >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="absolute -right-2 -top-10 flex w-64 items-start gap-3 rounded-2xl bg-white p-3 text-sm shadow-[0_20px_40px_-18px_rgba(27,24,19,0.55)] ring-1 ring-grafite-200"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amarelo-500">
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#1b1813" strokeWidth={2.2} aria-hidden>
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>
              <b className="block text-grafite-900">A obra começou</b>
              <span className="text-xs text-grafite-500">Rua da Aurora · projeto que você acompanha</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const PASSOS = [
  {
    titulo: 'Relate',
    destaque: 'o que você vê',
    texto: 'Poste apagado, buraco, esgoto aberto. Marque o ponto no mapa em quatro passos — com seu apelido ou anônimo.',
    fundo: 'bg-amarelo-500',
    cena: <CenaRelate />,
  },
  {
    titulo: 'Apoie',
    destaque: 'quem está do seu lado',
    texto: 'Vizinhos confirmam, comentam e apoiam. Quanto mais gente aponta o mesmo problema, maior a repercussão no mapa.',
    fundo: 'bg-categoria-rosa-50',
    cena: <CenaApoie />,
  },
  {
    titulo: 'Vote',
    destaque: 'no que vai ser feito',
    texto: 'Quando o órgão abre consulta pública, seu voto é secreto e gera um comprovante. Ninguém vê sua escolha.',
    fundo: 'bg-amarelo-100',
    cena: <CenaVote />,
  },
  {
    titulo: 'Acompanhe',
    destaque: 'até a entrega',
    texto: 'Salve projetos, receba notificações e veja cada etapa da obra — com fotos, custo previsto e o antes e depois.',
    fundo: 'bg-status-verde-50',
    cena: <CenaAcompanhe />,
  },
]

// Os quatro passos do cidadão. É uma sequência de verdade (relatar vem antes
// de apoiar, votar e acompanhar), por isso a numeração. No desktop a seção
// fica presa e os passos deslizam para o lado conforme a rolagem; cada passo
// tem uma cena do próprio app que toca quando ele aparece.
export default function ComoFunciona() {
  const secao = useRef<HTMLElement>(null)
  const trilho = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const el = trilho.current
        if (!el) return
        const distancia = () => el.scrollWidth - document.documentElement.clientWidth
        gsap.to(el, {
          x: () => -distancia(),
          ease: 'none',
          scrollTrigger: {
            trigger: secao.current,
            pin: true,
            scrub: 0.8,
            end: () => `+=${distancia()}`,
            invalidateOnRefresh: true,
          },
        })
      })
      return () => mm.revert()
    },
    { scope: secao },
  )

  return (
    <section id="como-funciona" ref={secao} className="overflow-hidden bg-grafite-50">
      <div ref={trilho} className="flex flex-col will-change-transform lg:h-screen lg:w-max lg:flex-row">
        <div className="flex flex-col justify-center px-6 py-20 sm:px-12 lg:w-[38vw] lg:py-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amarelo-700">Como funciona</p>
          <h2 className="mt-4 font-heading text-5xl font-extrabold leading-[0.95] text-grafite-900 sm:text-7xl">
            Do problema na rua à <span className="font-serif font-normal italic text-amarelo-700">obra entregue</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-grafite-700">Quatro passos ligam quem mora na cidade a quem decide sobre ela.</p>
        </div>

        {PASSOS.map((p, i) => (
          <article
            key={p.titulo}
            className={`relative grid items-center gap-12 overflow-hidden px-6 py-16 text-grafite-900 sm:px-12 lg:h-screen lg:w-[78vw] lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-[5vw] lg:py-0 ${p.fundo}`}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-[0.18em] -left-[0.04em] font-serif text-[16rem] italic leading-none text-grafite-900/[0.07] lg:text-[34rem]"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="relative min-w-0">
              <span className="font-serif text-2xl italic text-grafite-700">{String(i + 1).padStart(2, '0')} / 04</span>
              <h3 className="mt-3 font-heading text-6xl font-extrabold leading-[0.9] tracking-[-0.03em] sm:text-8xl lg:text-[clamp(5rem,7vw,8.5rem)]">
                {p.titulo}
              </h3>
              <p className="mt-2 font-serif text-3xl italic sm:text-4xl">{p.destaque}</p>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-grafite-700">{p.texto}</p>
            </div>
            <div className="relative flex justify-center lg:justify-end">{p.cena}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
