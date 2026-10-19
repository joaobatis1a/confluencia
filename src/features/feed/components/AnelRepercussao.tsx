import { motion } from 'framer-motion'
import { nivelRepercussao } from '../../../lib/repercussao'

const COR = { baixa: '#cfcbc0', media: '#f5b800', alta: '#dc2626' } as const
// Valor em que o anel fecha a volta — só para desenhar, não é limite do produto.
const VOLTA_COMPLETA = 8

// Medidor circular da repercussão, com o número no centro.
export default function AnelRepercussao({ valor, size = 38 }: { valor: number; size?: number }) {
  const nivel = nivelRepercussao(valor)
  const raio = size / 2 - 3.5
  const circ = 2 * Math.PI * raio
  const fracao = Math.min(1, Math.max(0.06, valor / VOLTA_COMPLETA))

  return (
    <span className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={raio} fill="none" stroke="#e4e1d9" strokeWidth={3.5} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={raio}
          fill="none"
          stroke={COR[nivel]}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - fracao) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-[13px] font-extrabold text-grafite-900">
        {valor}
      </span>
      <span className="sr-only">Repercussão {nivel}: {valor}</span>
    </span>
  )
}
