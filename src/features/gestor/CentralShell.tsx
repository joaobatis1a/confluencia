import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

// Moldura da visão do órgão: fundo escuro com grade de planta e um brilho
// amarelo, para a pessoa saber na hora que está na central e não no Feed do
// morador. Mesma marca e mesmas fontes; muda o clima.
export default function CentralShell({
  kicker,
  titulo,
  sub,
  acoes,
  verComoMorador,
  children,
}: {
  kicker: string
  titulo: string
  sub?: string
  acoes?: ReactNode
  /** Rota do morador equivalente (ex.: /feed), com o link "ver como a população vê". */
  verComoMorador?: string
  children: ReactNode
}) {
  const { profile } = useAuth()
  return (
    <div className="relative min-h-[calc(100vh-57px)] overflow-hidden bg-grafite-900 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-40 h-[560px] w-[560px] rounded-full bg-amarelo-500/20 blur-[130px]" />
        <div className="absolute -bottom-52 -left-40 h-[460px] w-[460px] rounded-full bg-status-azul-500/15 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]"
          style={{ maskImage: 'radial-gradient(ellipse at 30% 0%, black, transparent 70%)' }}
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amarelo-500"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amarelo-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amarelo-500" />
              </span>
              {kicker}
              {profile?.orgao_nome && <span className="text-white/50">· {profile.orgao_nome}</span>}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-3 font-heading text-5xl font-extrabold leading-[0.95] tracking-[-0.02em] sm:text-7xl"
            >
              {titulo}
            </motion.h1>
            {sub && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4 max-w-xl text-[15px] text-white/65">
                {sub}
              </motion.p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {verComoMorador && (
              <Link to={`${verComoMorador}?visao=morador`} className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/60 ring-1 ring-white/15 transition-colors hover:text-white hover:ring-white/40">
                Ver como a população vê
              </Link>
            )}
            {acoes}
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}

export function Numero({ valor, rotulo, frase, alerta }: { valor: ReactNode; rotulo: string; frase: string; alerta?: boolean }) {
  return (
    <div className="border-b border-white/10 py-5 pr-4 odd:border-r even:pl-4 lg:border-b-0 lg:border-r lg:py-6 lg:pr-6 lg:last:border-r-0 lg:[&:not(:first-child)]:pl-6">
      <p className={`font-heading text-5xl font-extrabold leading-none tracking-[-0.03em] sm:text-6xl ${alerta ? 'text-status-vermelho-500' : 'text-white'}`}>{valor}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-white">{rotulo}</p>
      <p className="font-serif text-[15px] italic text-white/50">{frase}</p>
    </div>
  )
}
