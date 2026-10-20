import { motion, useReducedMotion } from 'framer-motion'

interface MarqueeProps {
  itens: string[]
  /** Segundos para uma volta completa. */
  duracao?: number
  reverso?: boolean
  className?: string
}

// Faixa de texto que corre sem parar (o conteúdo é duplicado para o loop
// ficar contínuo). Para quem prefere menos movimento, fica parada.
export default function Marquee({ itens, duracao = 28, reverso = false, className = '' }: MarqueeProps) {
  const reduzir = useReducedMotion()
  const faixa = (
    <span className="flex shrink-0 items-center">
      {itens.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6">{item}</span>
          <span aria-hidden className="text-[0.7em]">✦</span>
        </span>
      ))}
    </span>
  )

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-label={itens.join(' · ')}>
      <motion.div
        aria-hidden
        className="flex w-max"
        animate={reduzir ? undefined : { x: reverso ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: duracao, ease: 'linear', repeat: Infinity }}
      >
        {faixa}
        {faixa}
      </motion.div>
    </div>
  )
}
