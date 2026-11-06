import { useEffect, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { CATEGORIAS, type Categoria, type PostRepercussao } from '../../types/database'
import { CATEGORIA_RGB, rgb } from '../feed/cores'

// Gráficos em SVG puro (sem biblioteca) para a visão do órgão, desenhados para fundo escuro.

export function CountUp({ valor, className }: { valor: number; className?: string }) {
  const mv = useMotionValue(0)
  const texto = useTransform(mv, (v) => Math.round(v).toLocaleString('pt-BR'))
  useEffect(() => {
    const c = animate(mv, valor, { duration: 1.1, ease: [0.22, 1, 0.36, 1] })
    return () => c.stop()
  }, [valor, mv])
  return <motion.span className={className}>{texto}</motion.span>
}

export function Painel({ titulo, nota, children, className = '' }: { titulo?: string; nota?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[24px] bg-white/[0.05] p-5 ring-1 ring-white/10 ${className}`}>
      {titulo && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">{titulo}</h3>
          {nota && <span className="text-xs text-white/40">{nota}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Rosca por categoria. */
export function RoscaCategorias({ relatos }: { relatos: PostRepercussao[] }) {
  const contagem = CATEGORIAS.map((c) => ({ ...c, qtd: relatos.filter((r) => r.categoria === c.value).length }))
    .filter((c) => c.qtd > 0)
    .sort((a, b) => b.qtd - a.qtd)
  const total = contagem.reduce((s, c) => s + c.qtd, 0)
  const R = 38
  const C = 2 * Math.PI * R
  const inicios = contagem.map((_, i) => contagem.slice(0, i).reduce((s, c) => s + (c.qtd / total) * C, 0))
  if (total === 0) return <p className="text-sm text-white/50">Sem relatos neste filtro.</p>
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label="Relatos por categoria">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
        {contagem.map((c, i) => {
          const len = (c.qtd / total) * C
          return (
            <motion.circle
              key={c.value}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={rgb(CATEGORIA_RGB[c.value as Categoria])}
              strokeWidth="14"
              strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`}
              strokeDashoffset={-inicios[i]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
            />
          )
        })}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center fill-white font-heading text-[18px] font-extrabold">
          {total}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {contagem.slice(0, 5).map((c) => (
          <li key={c.value} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: rgb(CATEGORIA_RGB[c.value as Categoria]) }} />
            <span className="truncate text-white/80">{c.label}</span>
            <span className="ml-auto font-bold tabular-nums text-white">{c.qtd}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Bairros com mais repercussão acumulada. */
export function BarrasBairros({ relatos, limite = 6 }: { relatos: PostRepercussao[]; limite?: number }) {
  const porBairro = new Map<string, { qtd: number; peso: number }>()
  for (const r of relatos) {
    const atual = porBairro.get(r.bairro) ?? { qtd: 0, peso: 0 }
    porBairro.set(r.bairro, { qtd: atual.qtd + 1, peso: atual.peso + 1 + r.repercussao })
  }
  const linhas = [...porBairro.entries()].sort((a, b) => b[1].peso - a[1].peso).slice(0, limite)
  const maior = Math.max(1, ...linhas.map(([, v]) => v.peso))
  if (linhas.length === 0) return <p className="text-sm text-white/50">Sem relatos neste filtro.</p>
  return (
    <ul className="space-y-3">
      {linhas.map(([bairro, v], i) => (
        <li key={bairro}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-white">{bairro}</span>
            <span className="shrink-0 text-xs text-white/50">
              {v.qtd} {v.qtd === 1 ? 'relato' : 'relatos'}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amarelo-300 to-amarelo-500"
              initial={{ width: 0 }}
              animate={{ width: `${(v.peso / maior) * 100}%` }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Relatos por dia nos últimos 14 dias. */
export function Sparkline({ relatos }: { relatos: PostRepercussao[] }) {
  const DIAS = 14
  const [hoje] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const dias = Array.from({ length: DIAS }, (_, i) => {
    const ini = hoje.getTime() - (DIAS - 1 - i) * 86_400_000
    return relatos.filter((r) => {
      const t = new Date(r.created_at).getTime()
      return t >= ini && t < ini + 86_400_000
    }).length
  })
  const total = dias.reduce((a, b) => a + b, 0)
  const max = Math.max(1, ...dias)
  const W = 280
  const H = 64
  const pts = dias.map((v, i) => [(i / (DIAS - 1)) * W, H - 6 - (v / max) * (H - 14)] as const)
  const linha = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <div>
      <p className="font-heading text-4xl font-extrabold text-white">
        {total} <span className="text-base font-semibold text-white/50">relatos em 14 dias</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-16 w-full" role="img" aria-label="Relatos por dia">
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5b800" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f5b800" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${linha} L${W} ${H} L0 ${H} Z`} fill="url(#spark)" />
        <motion.path d={linha} fill="none" stroke="#f5b800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
        <circle cx={pts[DIAS - 1][0]} cy={pts[DIAS - 1][1]} r="4" fill="#f5b800" />
      </svg>
    </div>
  )
}
