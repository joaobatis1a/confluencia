import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { MarcoTimeline } from '../../../types/database'
import { dataLocal } from '../etapas'
import { hojeIso, rotuloDaSituacao, situacaoDoMarco } from '../timeline'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const fmt = (iso: string) => dataLocal(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

// Linha do tempo da obra: o traço vertical se preenche conforme a página rola
// e cada marco "acende" quando o traço chega nele. O atraso de cada marco vem de
// ../timeline.ts (Tarefa 3.1 da Ana).
export default function LinhaDoTempo({ marcos }: { marcos: MarcoTimeline[] }) {
  const raiz = useRef<HTMLOListElement>(null)
  const hoje = hojeIso()
  const proximo = marcos.findIndex((m) => !m.data_real)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.fromTo(
        '[data-trilho-preenchido]',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: raiz.current, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
        },
      )
      gsap.utils.toArray<HTMLElement>('[data-marco]').forEach((marco) => {
        gsap.from(marco, {
          opacity: 0.25,
          x: -14,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: marco, start: 'top 70%', toggleActions: 'play none none reverse' },
        })
      })
    },
    { scope: raiz },
  )

  if (marcos.length === 0) {
    return <p className="text-sm text-grafite-500">O órgão ainda não cadastrou as etapas desta obra.</p>
  }

  return (
    <ol ref={raiz} className="relative ml-4 space-y-10 py-2">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px] -translate-x-1/2 rounded-full bg-grafite-200" />
      <span
        aria-hidden
        data-trilho-preenchido
        className="absolute left-0 top-0 bottom-0 w-[3px] -translate-x-1/2 origin-top rounded-full bg-gradient-to-b from-status-verde-500 via-amarelo-500 to-amarelo-300"
      />
      {marcos.map((marco, i) => {
        const feito = Boolean(marco.data_real)
        const ehProximo = i === proximo
        const info = situacaoDoMarco(marco, hoje)
        return (
          <li key={i} data-marco className="relative pl-10">
            <span
              className={`absolute left-0 top-0.5 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-4 border-grafite-50 ${
                feito ? 'bg-status-verde-500 text-white' : ehProximo ? 'bg-amarelo-500 text-grafite-900' : 'bg-grafite-200 text-grafite-500'
              }`}
            >
              {ehProximo && <span className="absolute inset-0 animate-ping rounded-full bg-amarelo-500/60" />}
              {feito ? (
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
                  <path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="relative text-xs font-extrabold">{i + 1}</span>
              )}
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-grafite-500">
              {feito ? `Concluído em ${fmt(marco.data_real!)}` : ehProximo ? 'Próxima etapa' : 'Previsto'}
            </p>
            <p className="mt-1 font-heading text-2xl font-extrabold leading-tight text-grafite-900">{marco.nome}</p>
            <p className="mt-1 text-sm text-grafite-700">
              Previsão: {fmt(marco.data_prevista)}
              {info.diasAtraso > 0 && (
                <span className="ml-2 rounded-full bg-status-terracota-50 px-2 py-0.5 text-[11px] font-semibold text-status-terracota-700">
                  {rotuloDaSituacao(info)}
                </span>
              )}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
