import { motion } from 'framer-motion'
import type { ProjetoStatus } from '../../../types/database'
import { ETAPAS_PUBLICAS } from '../etapas'

interface TrilhoEtapasProps {
  contagem: Record<ProjetoStatus, number>
  total: number
  value: ProjetoStatus | 'todos'
  onChange: (v: ProjetoStatus | 'todos') => void
}

// O caminho de um projeto público (Proposto → Concluído) é o próprio filtro:
// cada parada mostra quantos projetos estão nela; clicar filtra a lista.
export default function TrilhoEtapas({ contagem, total, value, onChange }: TrilhoEtapasProps) {
  const opcoes: { valor: ProjetoStatus | 'todos'; label: string; qtd: number }[] = [
    { valor: 'todos', label: 'Todos', qtd: total },
    ...ETAPAS_PUBLICAS.map((e) => ({ valor: e.status, label: e.label, qtd: contagem[e.status] ?? 0 })),
  ]

  return (
    <div role="radiogroup" aria-label="Filtrar por etapa" className="relative -mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
      <div className="relative inline-flex min-w-max items-start">
        {/* Linha do trilho, desenhada da esquerda para a direita ao abrir. */}
        <span aria-hidden className="absolute left-[60px] right-[60px] top-[26px] h-[3px] rounded-full bg-grafite-200" />
        <motion.span
          aria-hidden
          className="absolute left-[60px] right-[60px] top-[26px] h-[3px] origin-left rounded-full bg-gradient-to-r from-amarelo-300 via-amarelo-500 to-status-verde-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />

        {opcoes.map((o, i) => {
          const ativo = value === o.valor
          const vazio = o.qtd === 0
          return (
            <button
              key={o.valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => onChange(o.valor)}
              className="group relative flex w-[120px] flex-col items-center gap-2 pt-1"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.15 + i * 0.08 }}
                className={`relative flex h-12 w-12 items-center justify-center rounded-full border-[3px] font-heading text-lg font-extrabold transition-colors ${
                  ativo
                    ? 'border-amarelo-500 bg-amarelo-500 text-grafite-900'
                    : vazio
                      ? 'border-grafite-200 bg-grafite-50 text-grafite-300'
                      : 'border-grafite-200 bg-white text-grafite-900 group-hover:border-amarelo-500'
                }`}
              >
                {ativo && (
                  <motion.span
                    layoutId="etapa-ativa-halo"
                    className="absolute -inset-2 rounded-full border-2 border-amarelo-500/50"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                {o.qtd}
              </motion.span>
              <span
                className={`text-xs font-semibold uppercase tracking-[0.08em] ${
                  ativo ? 'text-grafite-900' : vazio ? 'text-grafite-300' : 'text-grafite-500 group-hover:text-grafite-900'
                }`}
              >
                {o.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
