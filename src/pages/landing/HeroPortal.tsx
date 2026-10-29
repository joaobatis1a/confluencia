import { lazy, Suspense, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import type { PontoMapa } from './MapaCidade'

// O mapa (MapLibre) é o pedaço mais pesado da landing: carrega à parte, para o
// título aparecer sem esperar por ele.
const MapaCidade = lazy(() => import('./MapaCidade'))

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

export interface RelatoVitrine extends PontoMapa {
  bairro: string
  descricao: string
  interacoes: number
}

interface HeroPortalProps {
  /** Todos os relatos, como pinos no mapa. */
  pontos: PontoMapa[]
  carregou: boolean
  totais: { relatos: number; bairros: number }
  pronto: boolean
}

// Topo da landing: as palavras enormes e, entre elas, uma janela em cápsula
// com o Recife vivo em 3D. Ao rolar, a janela se abre até a cidade ocupar a
// tela inteira — a pessoa "entra" na cidade.
export default function HeroPortal({ pontos, carregou, totais, pronto }: HeroPortalProps) {
  const secao = useRef<HTMLElement>(null)

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
          // A janela é um elipse que cresce só com transform (barato): a moldura
          // escala e o conteúdo escala ao contrário, então a cidade não deforma.
          // No fim ela passa de 1.45x, quando o elipse já cobre a tela toda.
          const [ix, iy] = desktop ? [0.34, 0.62] : [0.84, 0.38]
          const moldura = secao.current!.querySelector<HTMLElement>('[data-janela]')!
          const dentroX = gsap.quickSetter('[data-janela-dentro]', 'scaleX')
          const dentroY = gsap.quickSetter('[data-janela-dentro]', 'scaleY')
          const compensar = () => {
            dentroX(1 / Number(gsap.getProperty(moldura, 'scaleX')))
            dentroY(1 / Number(gsap.getProperty(moldura, 'scaleY')))
          }
          gsap.set(moldura, { scaleX: ix, scaleY: iy })
          compensar()
          if (reduzir) return
          gsap
            .timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: secao.current,
                start: 'top top',
                end: '+=95%',
                pin: true,
                scrub: 0.25,
              },
            })
            .fromTo(
              moldura,
              { scaleX: ix, scaleY: iy },
              { scaleX: 1.45, scaleY: 1.45, duration: 1, ease: 'power1.in', onUpdate: compensar },
              0,
            )
            .to('[data-linha="1"]', { xPercent: -60, opacity: 0, duration: 0.7 }, 0)
            .to('[data-linha="2"]', { xPercent: 60, opacity: 0, duration: 0.7 }, 0)
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
      return () => linhas.revert()
    },
    { scope: secao, dependencies: [pronto] },
  )

  return (
    <section ref={secao} className="relative h-[100svh] overflow-hidden bg-grafite-50">
      {/* A cidade, vista pela janela */}
      <div data-janela-escala className="absolute inset-0">
        <div data-janela className="absolute inset-0 overflow-hidden rounded-[50%] bg-[#9fd3d6] will-change-transform">
          <div data-janela-dentro className="absolute inset-0 will-change-transform">
            <Suspense fallback={null}>
              <MapaCidade pontos={pontos} carregou={carregou} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Palavras */}
      <h1 className="pointer-events-none absolute inset-0 font-heading font-extrabold leading-[0.82] tracking-[-0.04em] text-grafite-900">
        <span
          data-linha="1"
          className="absolute will-change-transform left-[4vw] top-[14vh] block text-[clamp(4rem,13vw,15rem)] md:top-[11vh]"
        >
          <span data-letras>Sua cidade</span>
        </span>
        <span
          data-linha="2"
          className="absolute will-change-transform bottom-[19vh] right-[4vw] block font-serif text-[clamp(4.4rem,14vw,16rem)] font-normal italic tracking-[-0.02em] md:bottom-[13vh]"
        >
          <span data-letras>tem voz.</span>
        </span>
      </h1>

      {/* O que aparece quando a janela termina de abrir */}
      <div
        data-dentro
        className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[8vh] opacity-0"
      >
        <div className="pointer-events-auto mx-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[28px] bg-white px-6 py-4 shadow-[0_30px_60px_-30px_rgba(27,24,19,0.6)]">
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
