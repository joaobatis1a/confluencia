import { useRef, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import type { Categoria } from '../../types/database'
import { CATEGORIAS } from '../../types/database'
import { CATEGORIA_RGB, rgb } from '../../features/feed/cores'
import IconeCategoria from '../../features/feed/components/IconeCategoria'
import MapaCidade, { type PontoMapa } from './MapaCidade'
import Magnetico from './Magnetico'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

export interface RelatoVitrine extends PontoMapa {
  bairro: string
  descricao: string
  interacoes: number
}

// Onde cada cartão de relato flutua em volta da janela, e quanto ele anda
// com o mouse (profundidade).
const LUGARES = [
  { classe: 'right-[5vw] top-[17vh] rotate-[5deg]', fundo: 1.4 },
  { classe: 'left-[4vw] bottom-[25vh] -rotate-[6deg]', fundo: 1.0 },
  {
    classe: 'right-[10vw] bottom-[33vh] -rotate-[3deg] hidden xl:block',
    fundo: 0.6,
  },
]

interface HeroPortalProps {
  relatos: RelatoVitrine[]
  totais: { relatos: number; bairros: number }
  pronto: boolean
}

// Topo da landing: as palavras enormes e, entre elas, uma janela em cápsula
// com o Recife vivo em 3D. Ao rolar, a janela se abre até a cidade ocupar a
// tela inteira — a pessoa "entra" na cidade.
export default function HeroPortal({ relatos, totais, pronto }: HeroPortalProps) {
  const secao = useRef<HTMLElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 18 })
  const sy = useSpring(my, { stiffness: 60, damping: 18 })

  function mover(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return
    mx.set(e.clientX / window.innerWidth - 0.5)
    my.set(e.clientY / window.innerHeight - 0.5)
  }

  // Rolagem: a janela abre, as palavras saem para os lados, a cidade fica.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(
        {
          desktop: '(min-width: 768px)',
          celular: '(max-width: 767px)',
          reduzir: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { desktop, reduzir } = ctx.conditions as {
            desktop: boolean
            reduzir: boolean
          }
          const inicio = desktop ? 'inset(19% 33% 19% 33% round 400px)' : 'inset(30% 8% 32% 8% round 220px)'
          gsap.set('[data-janela]', { clipPath: inicio })
          if (reduzir) return
          gsap
            .timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: secao.current,
                start: 'top top',
                end: '+=130%',
                pin: true,
                scrub: 0.6,
              },
            })
            .fromTo('[data-janela]', { clipPath: inicio }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 }, 0)
            .to('[data-linha="1"]', { xPercent: -60, opacity: 0, duration: 0.7 }, 0)
            .to('[data-linha="2"]', { xPercent: 60, opacity: 0, duration: 0.7 }, 0)
            .to('[data-cartoes]', { y: '-35vh', opacity: 0, duration: 0.55 }, 0)
            .to('[data-rodape-hero]', { y: 40, opacity: 0, duration: 0.3 }, 0)
            .fromTo('[data-dentro]', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.35 }, 0.7)
        },
      )
      return () => mm.revert()
    },
    { scope: secao },
  )

  // Entrada, depois da abertura: letras sobem de dentro de uma máscara e a
  // janela nasce de um risco.
  useGSAP(
    () => {
      if (!pronto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const linhas = SplitText.create('[data-linha] [data-letras]', {
        type: 'chars',
        mask: 'chars',
      })
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from('[data-janela-escala]', { scaleY: 0, duration: 1.4, ease: 'expo.inOut' }, 0)
        .from(linhas.chars, { yPercent: 120, duration: 1.2, stagger: 0.035 }, 0.35)
        .from(
          '[data-cartao-in]',
          {
            scale: 0,
            opacity: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: 'back.out(2)',
          },
          0.9,
        )
        .from('[data-rodape-hero] > *', { y: 24, opacity: 0, stagger: 0.08, duration: 0.8 }, 1)
      return () => linhas.revert()
    },
    { scope: secao, dependencies: [pronto] },
  )

  return (
    <section ref={secao} onPointerMove={mover} className="relative h-[100svh] overflow-hidden bg-grafite-50">
      {/* A cidade, vista pela janela */}
      <div data-janela-escala className="absolute inset-0">
        <div data-janela className="absolute inset-0 bg-[#9fd3d6]">
          <MapaCidade pontos={relatos} />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(27,24,19,0.18)]" />
        </div>
      </div>

      {/* Palavras */}
      <h1 className="pointer-events-none absolute inset-0 font-heading font-extrabold leading-[0.82] tracking-[-0.04em] text-grafite-900">
        <span
          data-linha="1"
          className="absolute left-[4vw] top-[14vh] block text-[clamp(4rem,13vw,15rem)] md:top-[11vh]"
        >
          <span data-letras>Sua cidade</span>
        </span>
        <span
          data-linha="2"
          className="absolute bottom-[19vh] right-[4vw] block font-serif text-[clamp(4.4rem,14vw,16rem)] font-normal italic tracking-[-0.02em] md:bottom-[13vh]"
        >
          <span data-letras>tem voz.</span>
        </span>
      </h1>

      {/* Relatos reais flutuando em volta */}
      <div data-cartoes className="pointer-events-none absolute inset-0 z-10">
        {relatos.slice(0, LUGARES.length).map((r, i) => (
          <CartaoFlutuante key={r.id} relato={r} lugar={LUGARES[i]} sx={sx} sy={sy} indice={i} />
        ))}
      </div>

      {/* Rodapé do topo */}
      <div
        data-rodape-hero
        className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-5 px-[4vw] pb-[4vh]"
      >
        <p className="max-w-xs text-[15px] leading-snug text-grafite-700">
          <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amarelo-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-status-verde-500" /> Recife, agora
          </span>
          Relate o que vê na rua, apoie vizinhos, vote nos projetos e acompanhe cada obra até a entrega.
        </p>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-grafite-500 lg:block">
            Role para entrar ↓
          </span>
          <Magnetico>
            <Link
              to="/feed"
              className="group inline-flex items-center gap-3 rounded-full bg-amarelo-500 py-2 pl-6 pr-2 text-base font-bold text-grafite-900 shadow-[0_18px_40px_-16px_rgba(245,184,0,0.9)]"
            >
              Entrar no Confluência
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition-transform duration-300 group-hover:rotate-[-45deg]">
                →
              </span>
            </Link>
          </Magnetico>
        </div>
      </div>

      {/* O que aparece quando a janela termina de abrir */}
      <div
        data-dentro
        className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[8vh] opacity-0"
      >
        <div className="pointer-events-auto mx-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[28px] bg-white/85 px-6 py-4 shadow-[0_30px_60px_-30px_rgba(27,24,19,0.6)] backdrop-blur-xl">
          <p className="font-heading text-xl font-extrabold text-grafite-900 sm:text-2xl">
            Este é o Recife <span className="font-serif font-normal italic text-amarelo-700">agora.</span>
          </p>
          <p className="text-sm text-grafite-500">
            {totais.relatos} relatos · {totais.bairros} bairros
          </p>
          <Link to="/feed" className="rounded-full bg-amarelo-500 px-5 py-2.5 text-sm font-bold text-grafite-900">
            Explorar o mapa →
          </Link>
        </div>
      </div>
    </section>
  )
}

function CartaoFlutuante({
  relato,
  lugar,
  sx,
  sy,
  indice,
}: {
  relato: RelatoVitrine
  lugar: (typeof LUGARES)[number]
  sx: MotionValue<number>
  sy: MotionValue<number>
  indice: number
}) {
  const x = useTransform(sx, (v) => v * 70 * lugar.fundo)
  const y = useTransform(sy, (v) => v * 50 * lugar.fundo)
  const cor = rgb(CATEGORIA_RGB[relato.categoria as Categoria])
  const categoria = CATEGORIAS.find((c) => c.value === relato.categoria)?.label ?? relato.categoria

  return (
    <div data-cartao className={`absolute hidden md:block ${lugar.classe}`}>
      <div data-cartao-in>
        <motion.div style={{ x, y }}>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 4 + indice,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-60 rounded-[22px] bg-white p-4 shadow-[0_24px_50px_-24px_rgba(27,24,19,0.55)] ring-1 ring-grafite-200"
          >
            <span className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                style={{ background: cor }}
              >
                <IconeCategoria categoria={relato.categoria} />
              </span>
              <span className="text-[11px] font-bold uppercase leading-tight tracking-[0.08em]" style={{ color: cor }}>
                {categoria}
                <span className="block font-semibold normal-case tracking-normal text-grafite-500">
                  {relato.bairro}
                </span>
              </span>
            </span>
            <span className="mt-2.5 block text-sm leading-snug text-grafite-900 line-clamp-2">{relato.descricao}</span>
            {relato.interacoes > 0 && (
              <span className="mt-2 block text-xs font-semibold text-categoria-rosa-700">
                ♥ {relato.interacoes} {relato.interacoes === 1 ? 'apoio' : 'apoios'}
              </span>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
