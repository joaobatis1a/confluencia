import { useRef, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// Envolve um botão para ele "puxar" na direção do cursor quando o mouse chega
// perto, e voltar com mola ao sair. Só com mouse; no toque fica parado.
export default function Magnetico({ children, forca = 0.35 }: { children: ReactNode; forca?: number }) {
  const caixa = useRef<HTMLSpanElement>(null)
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 })

  function mover(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || !caixa.current) return
    const r = caixa.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * forca)
    y.set((e.clientY - (r.top + r.height / 2)) * forca)
  }

  function soltar() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span ref={caixa} onPointerMove={mover} onPointerLeave={soltar} style={{ x, y }} className="inline-flex">
      {children}
    </motion.span>
  )
}
