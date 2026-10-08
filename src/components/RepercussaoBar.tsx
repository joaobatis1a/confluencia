import { motion } from 'framer-motion'
import { nivelRepercussao, percentualBarra, REPERCUSSAO_STYLES } from '../lib/repercussao'

interface RepercussaoBarProps {
  valor: number
  /** 'compact' para o card da listagem, 'full' para a tela de detalhe (com texto explicativo). */
  variant?: 'compact' | 'full'
  className?: string
}

export default function RepercussaoBar({ valor, variant = 'compact', className = '' }: RepercussaoBarProps) {
  const nivel = nivelRepercussao(valor)
  const pct = percentualBarra(valor)
  const style = REPERCUSSAO_STYLES[nivel]

  const bar = (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-grafite-200 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${style.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
    </div>
  )

  if (variant === 'compact') return <div className={className}>{bar}</div>

  return (
    <div className={`rounded-[var(--radius-field)] border border-grafite-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-grafite-900">Repercussão do relato</span>
        <span className={`text-xs font-semibold uppercase tracking-wide ${style.text}`}>
          {style.label} repercussão
        </span>
      </div>
      {bar}
      <p className="text-xs text-grafite-500 mt-3">
        Calculada pela recorrência de relatos parecidos na região e pelo engajamento com este post.
      </p>
    </div>
  )
}
