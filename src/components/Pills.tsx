import { motion } from 'framer-motion'

export interface PillOption<T extends string> {
  value: T
  label: string
}

interface PillsProps<T extends string> {
  options: PillOption<T>[]
  value: T
  onChange: (value: T) => void
  /** layoutId precisa ser único por instância na tela (framer-motion anima entre pills do MESMO grupo). */
  layoutId: string
}

// Filtro em pills com indicador que desliza entre as opções (framer-motion
// layoutId) — usado no filtro de categoria do Feed e de status de Projetos.
export default function Pills<T extends string>({ options, value, onChange, layoutId }: PillsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              active
                ? 'text-grafite-900 border-transparent'
                : 'text-grafite-700 border-grafite-300 hover:bg-grafite-100'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-amarelo-500"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
