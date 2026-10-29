import { motion } from 'framer-motion'
import type { MarcoTimeline } from '../../../types/database'
import { resumoDaTimeline, rotuloDaSituacao, situacaoDoMarco, type SituacaoMarco } from '../timeline'

// Tarefa 3.1 da Ana (passo 1): linha do tempo com previsto × real e indicação de
// atraso/cumprido. Cores só do conjunto de status do design system.
const PONTO: Record<SituacaoMarco, string> = {
  cumprido: 'bg-status-verde-500',
  cumprido_atraso: 'bg-status-verde-500',
  atrasado: 'bg-status-vermelho-500',
  pendente: 'bg-grafite-300',
}

const ROTULO: Record<SituacaoMarco, string> = {
  cumprido: 'bg-status-verde-50 text-status-verde-700',
  cumprido_atraso: 'bg-status-terracota-50 text-status-terracota-700',
  atrasado: 'bg-status-vermelho-50 text-status-vermelho-700',
  pendente: 'bg-grafite-100 text-grafite-700',
}

const data = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')

export default function TimelineProjeto({ marcos, hoje }: { marcos: MarcoTimeline[]; hoje: string }) {
  if (marcos.length === 0) {
    // timeline pode vir vazia (contrato de dados) — projeto recém-criado sem marcos
    return <p className="text-sm text-grafite-500">Nenhum marco cadastrado ainda.</p>
  }

  return (
    <>
      <p className="text-xs text-grafite-500 mb-3">{resumoDaTimeline(marcos, hoje)}</p>
      <ol className="space-y-4">
        {marcos.map((marco, i) => {
          const info = situacaoDoMarco(marco, hoje)
          return (
            <motion.li
              key={`${marco.nome}-${i}`}
              className="flex items-start gap-3 text-sm"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <motion.span
                className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${PONTO[info.situacao]}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08 + 0.1, type: 'spring', stiffness: 400 }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-grafite-900">{marco.nome}</p>
                <p className="text-grafite-500 text-xs mt-0.5">
                  Previsto: {data(marco.data_prevista)}
                  {marco.data_real && ` · Real: ${data(marco.data_real)}`}
                </p>
                <span
                  className={`inline-block mt-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROTULO[info.situacao]}`}
                >
                  {rotuloDaSituacao(info)}
                </span>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </>
  )
}
