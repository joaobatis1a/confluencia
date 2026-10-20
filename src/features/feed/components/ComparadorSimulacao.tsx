import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { motion } from 'framer-motion'
import type { Categoria } from '../../../types/database'
import IconeCategoria from './IconeCategoria'

// Tarefa 4.1 do João: simulação visual — ilustrativa, não preditiva (Escopo Geral).
const SIMULACAO: Record<Categoria, { hoje: string; depois: string }> = {
  mobilidade: { hoje: 'Trânsito travado e calçada sem passagem', depois: 'Via recapeada, faixa e calçada livres' },
  iluminacao: { hoje: 'Trecho escuro depois das 18h', depois: 'Postes funcionando, rua visível à noite' },
  seguranca: { hoje: 'Ponto evitado por quem passa', depois: 'Área movimentada e vigiada' },
  saneamento: { hoje: 'Esgoto a céu aberto e mau cheiro', depois: 'Rede fechada e rua seca' },
  pracas_lazer: { hoje: 'Praça sem uso e equipamentos quebrados', depois: 'Praça ocupada por moradores' },
  saude: { hoje: 'Atendimento longe ou lotado', depois: 'Atendimento próximo e acessível' },
  educacao: { hoje: 'Escola com estrutura comprometida', depois: 'Escola reformada e segura' },
  outros: { hoje: 'Problema ativo no local', depois: 'Problema resolvido' },
}

// Arraste a divisória para comparar "hoje" com "depois de resolvido".
export default function ComparadorSimulacao({ categoria }: { categoria: Categoria }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)
  const [arrastando, setArrastando] = useState(false)
  const sim = SIMULACAO[categoria]

  function mover(e: PointerEvent<HTMLDivElement>) {
    if (!arrastando || !caixa.current) return
    const r = caixa.current.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))
  }

  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
    if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
  }

  const painel = (tipo: 'hoje' | 'depois') => (
    <div
      className={`absolute inset-0 flex flex-col justify-between p-6 sm:p-8 ${
        tipo === 'hoje' ? 'bg-grafite-700 text-grafite-200' : 'bg-amarelo-500 text-grafite-900'
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            tipo === 'hoje'
              ? 'repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 2px, transparent 2px 14px)'
              : 'radial-gradient(circle at 70% 30%, rgba(255,255,255,.9), transparent 55%)',
        }}
      />
      <span
        className={`relative w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
          tipo === 'hoje' ? 'bg-black/30' : 'bg-white/50'
        } ${tipo === 'depois' ? 'self-end' : ''}`}
      >
        {tipo === 'hoje' ? 'Hoje' : 'Depois de resolvido'}
      </span>
      <div className={`relative flex items-end gap-4 ${tipo === 'depois' ? 'flex-row-reverse text-right' : ''}`}>
        <span className={tipo === 'hoje' ? 'opacity-40' : ''}>
          <IconeCategoria categoria={categoria} size={64} />
        </span>
        <p className="max-w-[16rem] font-heading text-2xl sm:text-3xl font-extrabold leading-tight">
          {tipo === 'hoje' ? sim.hoje : sim.depois}
        </p>
      </div>
    </div>
  )

  return (
    <div>
      <div
        ref={caixa}
        className="relative h-72 select-none overflow-hidden rounded-[28px] touch-none"
        onPointerMove={mover}
        onPointerUp={() => setArrastando(false)}
        onPointerLeave={() => setArrastando(false)}
      >
        {painel('hoje')}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          {painel('depois')}
        </div>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparar hoje e depois de resolvido"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={teclado}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setArrastando(true)
          }}
          onPointerMove={mover}
          onPointerUp={() => setArrastando(false)}
          className="absolute inset-y-0 z-10 -ml-6 flex w-12 cursor-ew-resize items-center justify-center focus:outline-none"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.35)]" />
          <motion.span
            animate={arrastando ? { scale: 1.15 } : { scale: [1, 1.08, 1] }}
            transition={arrastando ? { duration: 0.15 } : { duration: 1.6, repeat: Infinity }}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-grafite-900 shadow-lg ring-4 ring-amarelo-500/40"
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
              <path d="m9 6-6 6 6 6M15 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        </div>
      </div>
      <p className="mt-3 text-xs text-grafite-500">
        Arraste a divisória para comparar. Simulação ilustrativa — não é uma previsão.
      </p>
    </div>
  )
}
