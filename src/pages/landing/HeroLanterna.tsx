import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'

const FOTO = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Rio_Capibaribe_%C3%A0_noite%2C_Recife_%28PE%29.jpg/1280px-Rio_Capibaribe_%C3%A0_noite%2C_Recife_%28PE%29.jpg',
  credito: 'Rio Capibaribe à noite · Marcos Elias de Oliveira Júnior · CC0',
  fonte: 'https://commons.wikimedia.org/wiki/File:Rio_Capibaribe_%C3%A0_noite,_Recife_(PE).jpg',
}

// Topo da landing: a cidade em preto e branco e uma "lanterna" que segue o
// cursor revelando a cidade em cor — a cidade que a gente pode construir.
// No toque (sem cursor), a lanterna passeia sozinha.
export default function HeroLanterna({ children }: { children: ReactNode }) {
  const caixa = useRef<HTMLElement>(null)
  const x = useMotionValue(70)
  const y = useMotionValue(45)
  const raio = useMotionValue(0)
  const reduzir = useReducedMotion()
  const mascara = useMotionTemplate`radial-gradient(circle ${raio}px at ${x}% ${y}%, black 55%, transparent 100%)`
  const anelX = useMotionTemplate`${x}%`
  const anelY = useMotionTemplate`${y}%`
  const anelOpacidade = useTransform(raio, [0, 260], [0, 1])

  useEffect(() => {
    const abrir = animate(raio, 260, { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 })
    // Sem mouse (celular) ou com movimento reduzido: a lanterna passeia devagar.
    const semCursor = window.matchMedia('(hover: none)').matches
    if (!semCursor || reduzir) return () => abrir.stop()
    const ax = animate(x, [70, 30, 55, 75, 70], { duration: 14, repeat: Infinity, ease: 'easeInOut' })
    const ay = animate(y, [45, 60, 30, 55, 45], { duration: 14, repeat: Infinity, ease: 'easeInOut' })
    return () => {
      abrir.stop()
      ax.stop()
      ay.stop()
    }
  }, [x, y, raio, reduzir])

  function mover(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse' || !caixa.current) return
    const r = caixa.current.getBoundingClientRect()
    animate(x, ((e.clientX - r.left) / r.width) * 100, { duration: 0.35, ease: 'easeOut' })
    animate(y, ((e.clientY - r.top) / r.height) * 100, { duration: 0.35, ease: 'easeOut' })
  }

  return (
    <section
      ref={caixa}
      onPointerMove={mover}
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-grafite-900 text-white"
    >
      <img
        src={FOTO.url}
        alt="Rio Capibaribe à noite, no Recife"
        className="absolute inset-0 h-full w-full scale-105 object-cover grayscale brightness-[0.3] contrast-125"
      />
      <motion.img
        src={FOTO.url}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-105 object-cover saturate-150"
        style={{ WebkitMaskImage: mascara, maskImage: mascara }}
      />
      {/* Anel amarelo da lanterna */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amarelo-500/40"
        style={{ left: anelX, top: anelY, opacity: anelOpacidade }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-grafite-900 via-grafite-900/30 to-transparent" />

      <div className="relative z-10 w-full">{children}</div>

      <a
        href={FOTO.fonte}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 right-4 z-10 text-[10px] text-white/50 hover:text-white/80"
      >
        Foto: {FOTO.credito}
      </a>
    </section>
  )
}
