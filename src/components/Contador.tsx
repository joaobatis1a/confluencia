import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

// Número que conta de 0 até o valor quando aparece na tela.
export default function Contador({ valor, className = '' }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visivel = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduzir = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !visivel) return
    if (reduzir) {
      el.textContent = String(valor)
      return
    }
    const controle = animate(0, valor, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v))
      },
    })
    return () => controle.stop()
  }, [visivel, valor, reduzir])

  return (
    <span ref={ref} className={className}>
      0
    </span>
  )
}
