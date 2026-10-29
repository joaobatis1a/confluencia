import { motion } from 'framer-motion'

// Tarefa 3.1 do João (Semana 3): "barra votar sim/não" — resultado agregado
// público (lê de `votos_resultado`, nunca da tabela `votos` linha a linha).
// Tarefa 3.1 da Ana, passo 4: texto do resultado agregado ("72% a favor · 1.240 votos").
interface VotoBarProps {
  favor: number
  contra: number
  className?: string
}

export default function VotoBar({ favor, contra, className = '' }: VotoBarProps) {
  const total = favor + contra
  const pctFavor = total === 0 ? 50 : (favor / total) * 100
  const pctContra = 100 - pctFavor

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
        <span className="text-status-verde-700">A favor · {favor.toLocaleString('pt-BR')}</span>
        <span className="text-status-vermelho-700">Contra · {contra.toLocaleString('pt-BR')}</span>
      </div>
      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-grafite-200">
        <motion.div
          className="h-full bg-status-verde-500"
          initial={{ width: 0 }}
          animate={{ width: `${pctFavor}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-status-vermelho-500"
          initial={{ width: 0 }}
          animate={{ width: `${pctContra}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-grafite-500 mt-1.5">
        {total === 0
          ? 'Nenhum voto registrado ainda.'
          : `${Math.round(pctFavor)}% a favor · ${total.toLocaleString('pt-BR')} ${
              total === 1 ? 'voto' : 'votos'
            }`}
      </p>
    </div>
  )
}
