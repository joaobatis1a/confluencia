import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger)

interface TextoReveladoProps {
  children: ReactNode
  className?: string
  /** Cor da tarja que passa por cima de cada linha. */
  cor?: string
}

// Cada linha do texto é coberta por uma tarja que entra pela esquerda e sai
// pela direita, revelando o texto por baixo — dispara quando entra na tela.
export default function TextoRevelado({ children, className = '', cor = 'var(--color-amarelo-500)' }: TextoReveladoProps) {
  const ref = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const corTexto = getComputedStyle(el).color
      const split = SplitText.create(el, { type: 'lines' })
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true } })

      split.lines.forEach((linha, i) => {
        const l = linha as HTMLElement
        l.style.position = 'relative'
        const tarja = document.createElement('span')
        Object.assign(tarja.style, {
          position: 'absolute',
          inset: '0 -4px',
          background: cor,
          transform: 'scaleX(0)',
          transformOrigin: 'left center',
          pointerEvents: 'none',
        })
        l.appendChild(tarja)
        gsap.set(l, { color: 'transparent' })
        const t = i * 0.12
        tl.to(tarja, { scaleX: 1, duration: 0.45, ease: 'power3.inOut' }, t)
          .set(l, { color: corTexto }, t + 0.45)
          .set(tarja, { transformOrigin: 'right center' }, t + 0.45)
          .to(tarja, { scaleX: 0, duration: 0.45, ease: 'power3.inOut' }, t + 0.45)
      })

      return () => split.revert()
    },
    { scope: ref },
  )

  return (
    <p ref={ref} className={className}>
      {children}
    </p>
  )
}
