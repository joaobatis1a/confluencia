import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useDragControls, useMotionValue, useTransform, type PanInfo } from 'framer-motion'

export type Parada = 'baixa' | 'meio' | 'cheia'

export interface GavetaMobileHandle {
  irPara: (parada: Parada) => void
}

interface GavetaMobileProps {
  /** Parte de cima, por onde a gaveta é arrastada (alça + título). */
  topo: ReactNode
  children: ReactNode
}

// Altura visível quando a gaveta está "baixa": alça + título + busca.
const ESPIADA = 188

// Painel do Feed no celular: gaveta arrastável com três paradas, no padrão de
// apps de mapa — baixa (mapa grande), meio (início) e cheia (só a lista).
const GavetaMobile = forwardRef<GavetaMobileHandle, GavetaMobileProps>(function GavetaMobile({ topo, children }, ref) {
  const area = useRef<HTMLDivElement>(null)
  const controles = useDragControls()
  const [altura, setAltura] = useState(0)
  const y = useMotionValue(0)
  const alturaVisivel = useTransform(y, (v) => Math.max(ESPIADA, altura - v))

  const paradas = (h: number): Record<Parada, number> => ({
    cheia: 10,
    meio: Math.round(h * 0.44),
    baixa: Math.max(10, h - ESPIADA),
  })

  useEffect(() => {
    const el = area.current
    if (!el) return
    const medir = () => {
      const h = el.getBoundingClientRect().height
      setAltura(h)
      y.set(paradas(h).meio)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function irPara(parada: Parada) {
    animate(y, paradas(altura)[parada], { type: 'spring', stiffness: 380, damping: 38 })
  }

  useImperativeHandle(ref, () => ({ irPara }))

  function soltar(_: unknown, info: PanInfo) {
    const p = paradas(altura)
    // Considera a velocidade: um "peteleco" leva à próxima parada mesmo arrastando pouco.
    const projetado = y.get() + info.velocity.y * 0.2
    const maisPerto = (Object.keys(p) as Parada[]).reduce((a, b) =>
      Math.abs(p[a] - projetado) < Math.abs(p[b] - projetado) ? a : b,
    )
    irPara(maisPerto)
  }

  return (
    <div ref={area} className="pointer-events-none absolute inset-0 z-20">
      <motion.aside
        data-anim="painel"
        drag="y"
        dragControls={controles}
        dragListener={false}
        dragConstraints={{ top: paradas(altura).cheia, bottom: paradas(altura).baixa }}
        dragElastic={0.06}
        onDragEnd={soltar}
        style={{ y, height: alturaVisivel }}
        className="pointer-events-auto absolute inset-x-0 top-0 flex flex-col overflow-hidden rounded-t-[28px] border-t border-white/70 bg-grafite-50/95 shadow-[0_-18px_50px_-20px_rgba(27,24,19,0.45)] backdrop-blur-xl"
      >
        <div onPointerDown={(e) => controles.start(e)} className="cursor-grab touch-none select-none active:cursor-grabbing">
          <div className="flex justify-center pt-2.5 pb-1">
            <span className="h-1.5 w-11 rounded-full bg-grafite-300" />
          </div>
          {topo}
        </div>
        {children}
      </motion.aside>
    </div>
  )
})

export default GavetaMobile
