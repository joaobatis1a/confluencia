import { Fragment, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { FOTOS_PROJETO } from '../../features/projetos/fotos'

gsap.registerPlugin(useGSAP, ScrollTrigger)

type Trecho = { texto: string; serif?: boolean } | { img: string; alt: string }

const TEXTO: Trecho[] = [
  { texto: 'Todo dia alguém passa por um buraco,' },
  { img: FOTOS_PROJETO.p1.url, alt: 'Avenida Norte' },
  { texto: 'um poste apagado, uma calçada quebrada,' },
  { img: FOTOS_PROJETO.p5.url, alt: 'Rua da Aurora' },
  { texto: 'e segue. O Confluência junta essas vozes' },
  { img: '/logo.png', alt: 'Confluência' },
  { texto: 'num mapa que' },
  { texto: 'ninguém consegue ignorar,', serif: true },
  { texto: 'e acompanha cada pedido' },
  { img: FOTOS_PROJETO.p4.url, alt: 'Rio Capibaribe' },
  { texto: 'até virar obra.' },
]

// Manifesto: um parágrafo enorme que vai "acendendo" palavra por palavra
// conforme a rolagem, com fotos da cidade encaixadas no meio da frase.
export default function Manifesto() {
  const secao = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const gatilho = { trigger: secao.current, start: 'top 70%', end: 'bottom 60%', scrub: true }
      gsap.fromTo('[data-palavra]', { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: gatilho })
      gsap.fromTo(
        '[data-pilula]',
        { width: 0, rotate: -12 },
        { width: '1.9em', rotate: 0, stagger: 0.4, ease: 'none', scrollTrigger: gatilho },
      )
    },
    { scope: secao },
  )

  return (
    <section ref={secao} className="bg-grafite-50 px-[4vw] py-[18vh]">
      <p className="mb-10 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-amarelo-700">
        <span className="h-px w-10 bg-amarelo-700" /> Por que existe
      </p>
      <p className="max-w-[22ch] font-heading text-[clamp(2.2rem,6.2vw,6.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-grafite-900 lg:max-w-[24ch]">
        {TEXTO.map((t, i) =>
          'img' in t ? (
            <span
              key={i}
              data-pilula
              className="mx-[0.12em] inline-block h-[0.78em] w-[1.9em] overflow-hidden rounded-full align-[-0.06em] ring-[3px] ring-amarelo-500"
            >
              <img src={t.img} alt={t.alt} className={`h-full w-full ${t.img === '/logo.png' ? 'bg-amarelo-500 object-contain p-[0.08em]' : 'object-cover'}`} />
            </span>
          ) : (
            <Fragment key={i}>
              {t.texto.split(' ').map((p, j) => (
                <span
                  key={j}
                  data-palavra
                  className={t.serif ? 'font-serif font-normal italic tracking-[-0.01em] text-amarelo-700' : undefined}
                >
                  {p}{' '}
                </span>
              ))}
            </Fragment>
          ),
        )}
      </p>
    </section>
  )
}
