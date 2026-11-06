import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

// Moldura da visão do órgão: mesmo fundo creme do resto do sistema, com brilhos
// suaves de amarelo e azul e o selo "órgão verificado" no topo. O que muda para
// o gestor é o conteúdo (fila de trabalho, quadro, números), não a identidade.
export default function CentralShell({
  kicker,
  titulo,
  sub,
  acoes,
  children,
}: {
  kicker: string
  titulo: string
  sub?: string
  acoes?: ReactNode
  children: ReactNode
}) {
  const { profile } = useAuth()
  return (
    <div className="relative min-h-[calc(100vh-57px)] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-amarelo-300/35 blur-[110px]" />
        <div className="absolute -left-32 top-40 h-[360px] w-[360px] rounded-full bg-status-azul-50 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-9 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-status-azul-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-status-azul-700">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
                  <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" strokeLinejoin="round" />
                  <path d="m8.5 12 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {kicker}
              </span>
              {profile?.orgao_nome && <span className="text-sm font-semibold text-grafite-500">{profile.orgao_nome}</span>}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-3 font-heading text-4xl font-extrabold leading-[0.98] tracking-[-0.02em] text-grafite-900 sm:text-6xl"
            >
              {titulo}
            </motion.h1>
            {sub && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-3 max-w-xl text-[15px] text-grafite-700">
                {sub}
              </motion.p>
            )}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-3">{acoes}</div>}
        </header>
        {children}
      </div>
    </div>
  )
}

export type Tom = 'vermelho' | 'amarelo' | 'azul' | 'verde' | 'cinza'

export const TOM: Record<Tom, { fundo: string; texto: string; barra: string }> = {
  vermelho: { fundo: 'bg-status-vermelho-50', texto: 'text-status-vermelho-700', barra: '#dc2626' },
  amarelo: { fundo: 'bg-amarelo-100', texto: 'text-amarelo-900', barra: '#f5b800' },
  azul: { fundo: 'bg-status-azul-50', texto: 'text-status-azul-700', barra: '#2563eb' },
  verde: { fundo: 'bg-status-verde-50', texto: 'text-status-verde-700', barra: '#16a34a' },
  cinza: { fundo: 'bg-grafite-100', texto: 'text-grafite-700', barra: '#7c776c' },
}

const ICONES = {
  alerta: <path d="M12 3 2.5 20h19L12 3Zm0 6.5v5M12 17.2v.1" />,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chama: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.3 1.2 1 1.8 1.7 2C10.2 8 10.5 5.5 12 3Z" />,
  pasta: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  voto: <path d="M4 12.5 9 17.5 20 6.5M4 20h16" />,
  obra: <path d="M3 20h18M5 20V10l7-5 7 5v10M10 20v-5h4v5" />,
  pin: <><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
}
export type NomeIcone = keyof typeof ICONES

export function Icone({ nome, size = 18 }: { nome: NomeIcone; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONES[nome]}
    </svg>
  )
}

/** Número do órgão: cartão com ícone colorido, valor grande e uma frase. Clicável quando filtra algo. */
export function KpiCard({
  valor,
  rotulo,
  frase,
  tom,
  icone,
  ativo,
  onClick,
  indice = 0,
}: {
  valor: ReactNode
  rotulo: string
  frase: string
  tom: Tom
  icone: NomeIcone
  ativo?: boolean
  onClick?: () => void
  indice?: number
}) {
  const t = TOM[tom]
  const Tag = onClick ? motion.button : motion.div
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + indice * 0.06, type: 'spring', stiffness: 300, damping: 26 }}
      whileHover={onClick ? { y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      aria-pressed={onClick ? ativo : undefined}
      className={`relative overflow-hidden rounded-[24px] bg-white p-5 text-left ring-1 transition-shadow ${
        ativo ? 'shadow-[0_18px_36px_-18px_rgba(27,24,19,0.45)] ring-2 ring-grafite-900' : 'shadow-[0_2px_8px_-4px_rgba(27,24,19,0.12)] ring-grafite-200 hover:shadow-[0_18px_36px_-20px_rgba(27,24,19,0.4)]'
      }`}
    >
      <span aria-hidden className={`absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-70 ${t.fundo}`} />
      <span className={`relative grid h-10 w-10 place-items-center rounded-2xl ${t.fundo} ${t.texto}`}>
        <Icone nome={icone} />
      </span>
      <span className="relative mt-4 block font-heading text-5xl font-extrabold leading-none tracking-[-0.03em] text-grafite-900">{valor}</span>
      <span className="relative mt-2 block text-xs font-bold uppercase tracking-[0.12em] text-grafite-900">{rotulo}</span>
      <span className="relative block text-sm text-grafite-500">{frase}</span>
    </Tag>
  )
}

/** Título de seção com número e uma linha de apoio. */
export function Secao({ titulo, nota, acao, children, className = '' }: { titulo: string; nota?: string; acao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-grafite-900">{titulo}</h2>
          {nota && <p className="text-sm text-grafite-500">{nota}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  )
}
