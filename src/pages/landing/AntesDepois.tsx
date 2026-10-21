import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { CONTEUDO_PROJETO } from '../../features/projetos/conteudo'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// A mesma rua em 1855 e hoje. A rolagem passa uma cortina de uma foto para a
// outra e o ano corre junto — a cidade muda quando alguém acompanha.
export default function AntesDepois() {
  const secao = useRef<HTMLElement>(null)
  const ano = useRef<HTMLSpanElement>(null)
  const par = CONTEUDO_PROJETO.p6.antesDepois!

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(['[data-hoje]', '[data-hoje-img]'], { xPercent: 0 })
        if (ano.current) ano.current.textContent = '2026'
        return
      }
      const contagem = { v: 1855 }
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: secao.current, start: 'top top', end: '+=160%', pin: true, scrub: 0.5, invalidateOnRefresh: true },
        })
        // Cortina só com transform: a moldura entra da esquerda e a foto dentro
        // anda ao contrário na mesma medida, então parece parada.
        .fromTo('[data-hoje]', { xPercent: -100 }, { xPercent: 0, duration: 1 }, 0)
        .fromTo('[data-hoje-img]', { xPercent: 100 }, { xPercent: 0, duration: 1 }, 0)
        .fromTo('[data-cortina]', { x: 0 }, { x: () => window.innerWidth, duration: 1 }, 0)
        .to(
          contagem,
          {
            v: 2026,
            duration: 1,
            onUpdate: () => {
              if (ano.current) ano.current.textContent = String(Math.round(contagem.v))
            },
          },
          0,
        )
    },
    { scope: secao },
  )

  return (
    <section ref={secao} className="relative h-[100svh] overflow-hidden bg-grafite-900 text-white">
      <img data-antes src={par.antes.url} alt={par.antes.legenda} className="absolute inset-0 h-full w-full object-cover" />
      <div data-hoje className="absolute inset-0 overflow-hidden will-change-transform" style={{ transform: 'translateX(-100%)' }}>
        <img
          data-hoje-img
          src={par.depois.url}
          alt={par.depois.legenda}
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ transform: 'translateX(100%)' }}
        />
      </div>
      <span
        data-cortina
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 -ml-[3px] bg-amarelo-500 shadow-[0_0_40px_rgba(245,184,0,0.9)] will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60" />

      <div className="relative flex h-full flex-col justify-between px-[4vw] py-[10vh]">
        <h2 className="max-w-4xl font-heading text-[clamp(2.6rem,7vw,7rem)] font-extrabold leading-[0.92] tracking-[-0.03em]">
          A cidade muda quando alguém <span className="font-serif font-normal italic text-amarelo-500">acompanha.</span>
        </h2>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-sm text-sm text-white/80">
            Rua dos Judeus, 1855 — hoje Rua do Bom Jesus, no Recife Antigo. No Confluência, cada projeto mostra o antes,
            as fotos da obra e o depois.
            <span className="mt-2 block text-[11px] text-white/50">
              Fotos: {par.antes.autor} ({par.antes.licenca}) · {par.depois.autor} ({par.depois.licenca}) · Wikimedia Commons
            </span>
          </p>
          <span ref={ano} className="font-serif text-[clamp(5rem,16vw,15rem)] italic leading-[0.8] text-amarelo-500">
            1855
          </span>
        </div>
      </div>
    </section>
  )
}
