import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const PASSOS = [
  {
    titulo: 'Relate',
    destaque: 'o que você vê',
    texto: 'Poste apagado, buraco, esgoto aberto. Marque o ponto no mapa em quatro passos — com seu apelido ou anônimo.',
    fundo: 'bg-amarelo-500',
    tinta: 'text-grafite-900',
    icone: (
      <svg viewBox="0 0 32 42" className="h-40 w-32" aria-hidden>
        <path d="M16 41S3 25.5 3 15.5a13 13 0 0 1 26 0C29 25.5 16 41 16 41Z" fill="#1b1813" />
        <circle cx="16" cy="15.5" r="5" fill="#f5b800" />
      </svg>
    ),
  },
  {
    titulo: 'Apoie',
    destaque: 'quem está do seu lado',
    texto: 'Vizinhos confirmam, comentam e apoiam. Quanto mais gente aponta o mesmo problema, maior a repercussão no mapa.',
    fundo: 'bg-white',
    tinta: 'text-grafite-900',
    icone: <span className="font-heading text-[10rem] leading-none text-categoria-rosa-700">♥</span>,
  },
  {
    titulo: 'Vote',
    destaque: 'no que vai ser feito',
    texto: 'Quando o órgão abre consulta pública, seu voto é secreto e gera um comprovante. Ninguém vê sua escolha.',
    fundo: 'bg-amarelo-100',
    tinta: 'text-grafite-900',
    icone: (
      <span className="rotate-[-8deg] rounded-xl border-[5px] border-status-verde-700 px-5 py-3 text-center font-heading text-3xl font-extrabold uppercase leading-tight text-status-verde-700">
        Voto
        <br />
        registrado
      </span>
    ),
  },
  {
    titulo: 'Acompanhe',
    destaque: 'até a entrega',
    texto: 'Salve projetos, receba notificações e veja cada etapa da obra — com fotos, custo previsto e o antes e depois.',
    fundo: 'bg-status-verde-50',
    tinta: 'text-grafite-900',
    icone: (
      <span className="flex w-64 items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-4 flex-1 rounded-full ${i < 4 ? 'bg-status-verde-500' : 'bg-amarelo-500'}`} />
        ))}
      </span>
    ),
  },
]

// Os quatro passos do cidadão. É uma sequência de verdade (relatar vem antes
// de apoiar, votar e acompanhar), por isso a numeração. No desktop a seção
// fica presa e os passos deslizam para o lado conforme a rolagem.
export default function ComoFunciona() {
  const secao = useRef<HTMLElement>(null)
  const trilho = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const el = trilho.current
        if (!el) return
        const distancia = () => el.scrollWidth - window.innerWidth
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
      <div ref={trilho} className="flex flex-col lg:h-screen lg:w-max lg:flex-row">
        <div className="flex flex-col justify-center px-6 py-20 sm:px-12 lg:w-[38vw] lg:py-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amarelo-700">Como funciona</p>
          <h2 className="mt-4 font-heading text-5xl font-extrabold leading-[0.95] text-grafite-900 sm:text-7xl">
            Do problema na rua à{' '}
            <span className="font-serif font-normal italic text-amarelo-700">obra entregue</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-grafite-700">
            Quatro passos ligam quem mora na cidade a quem decide sobre ela.
          </p>
        </div>

        {PASSOS.map((p, i) => (
          <article
            key={p.titulo}
            className={`relative flex flex-col justify-between overflow-hidden px-6 py-14 sm:px-12 lg:h-screen lg:w-[62vw] lg:py-20 ${p.fundo} ${p.tinta}`}
          >
            <span className="font-serif text-[9rem] italic leading-none opacity-20 lg:text-[16rem]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
              <div>
                <h3 className="font-heading text-6xl font-extrabold leading-none sm:text-8xl">{p.titulo}</h3>
                <p className="mt-2 font-serif text-3xl italic sm:text-4xl">{p.destaque}</p>
                <p className="mt-6 max-w-lg text-lg leading-relaxed opacity-80">{p.texto}</p>
              </div>
              <div className="flex justify-center lg:justify-end">{p.icone}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
