import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { CATEGORIAS, STATUS_LABELS, type Projeto } from '../../../types/database'
import IconeCategoria from '../../feed/components/IconeCategoria'
import { CATEGORIA_RGB } from '../../feed/cores'
import { ETAPAS_PUBLICAS, diasRestantes, indiceEtapa, marcosCumpridos, proximoMarco } from '../etapas'

const INCLINACAO = 6
const fmt = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

// Card de projeto: a capa é uma "planta" (grade de projeto arquitetônico) na
// cor da categoria; embaixo, onde o projeto está no trilho e o andamento da obra.
export default function ProjetoCartao({ projeto, agora, indice }: { projeto: Projeto; agora: number; indice: number }) {
  const reduzir = useReducedMotion()
  const [r, g, b] = CATEGORIA_RGB[projeto.categoria]
  const categoria = CATEGORIAS.find((c) => c.value === projeto.categoria)?.label ?? projeto.categoria
  const etapa = indiceEtapa(projeto.status)
  const feitos = marcosCumpridos(projeto)
  const proximo = proximoMarco(projeto)
  const dias = diasRestantes(projeto, agora)

  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(my, [0, 1], [INCLINACAO, -INCLINACAO]), { stiffness: 260, damping: 22 })
  const rotateY = useSpring(useTransform(mx, [0, 1], [-INCLINACAO, INCLINACAO]), { stiffness: 260, damping: 22 })
  const brilho = useTransform(
    [mx, my],
    ([x, y]: number[]) => `radial-gradient(320px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.22), transparent 60%)`,
  )

  function mover(e: MouseEvent<HTMLElement>) {
    const caixa = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - caixa.left) / caixa.width)
    my.set((e.clientY - caixa.top) / caixa.height)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: indice * 0.06 }}
      style={{ perspective: 900 }}
    >
      <motion.div
        onMouseMove={reduzir ? undefined : mover}
        onMouseLeave={() => {
          mx.set(0.5)
          my.set(0.5)
        }}
        style={reduzir ? undefined : { rotateX, rotateY }}
        className="group h-full overflow-hidden rounded-[28px] border border-grafite-200 bg-white shadow-[0_2px_8px_-4px_rgba(27,24,19,0.12)] transition-shadow duration-300 hover:shadow-[0_28px_50px_-24px_rgba(27,24,19,0.4)]"
      >
        <Link to={`/projetos/${projeto.id}`} className="flex h-full flex-col">
          <div
            className="relative h-40 overflow-hidden"
            style={{ background: `linear-gradient(135deg, rgb(${r},${g},${b}), rgba(${r},${g},${b},0.78))` }}
          >
            {/* Grade de planta + traços de projeto */}
            <span
              aria-hidden
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)',
                backgroundSize: '48px 48px, 48px 48px, 12px 12px, 12px 12px',
              }}
            />
            <motion.span
              aria-hidden
              className="absolute -right-6 -bottom-8 text-white/25"
              animate={{ rotate: [0, -6, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <IconeCategoria categoria={projeto.categoria} size={150} />
            </motion.span>
            <motion.span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: brilho }} />

            <div className="relative flex h-full flex-col justify-between p-5 text-white">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] backdrop-blur">
                <IconeCategoria categoria={projeto.categoria} size={14} />
                {categoria}
              </span>
              <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-grafite-900 shadow-sm">
                {STATUS_LABELS[projeto.status]}
                {projeto.status === 'em_consulta' && dias !== null && (
                  <span className="text-amarelo-700"> · {dias}d</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-heading text-xl font-extrabold leading-tight text-grafite-900">{projeto.nome}</h3>
            <p className="mt-1.5 flex-1 text-sm text-grafite-700 line-clamp-2">{projeto.descricao}</p>

            {/* Trilho de etapas */}
            <div className="mt-5 flex items-center gap-1.5" aria-label={`Etapa: ${STATUS_LABELS[projeto.status]}`}>
              {ETAPAS_PUBLICAS.map((e, i) => (
                <span key={e.status} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-grafite-200">
                  {i <= etapa && (
                    <motion.span
                      className="absolute inset-0 origin-left rounded-full"
                      style={{
                        background:
                          i === etapa && projeto.status !== 'concluido'
                            ? 'var(--color-amarelo-500)'
                            : 'var(--color-status-verde-500)',
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.35, delay: 0.3 + indice * 0.06 + i * 0.12 }}
                    />
                  )}
                </span>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] text-grafite-500">
              <span>{ETAPAS_PUBLICAS[0].label}</span>
              <span>{ETAPAS_PUBLICAS[ETAPAS_PUBLICAS.length - 1].label}</span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-grafite-200 pt-4 text-xs">
              <span className="text-grafite-700">
                {projeto.timeline.length > 0 ? (
                  <>
                    <b className="text-grafite-900">
                      {feitos}/{projeto.timeline.length}
                    </b>{' '}
                    marcos da obra
                  </>
                ) : (
                  'Sem marcos ainda'
                )}
              </span>
              <span className="truncate text-right text-grafite-500">
                {projeto.status === 'concluido'
                  ? 'Obra entregue'
                  : proximo
                    ? `Próximo: ${proximo.nome} · ${fmt(proximo.data_prevista)}`
                    : ''}
              </span>
            </div>

            {projeto.origem_post_id && (
              <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-amarelo-50 px-2.5 py-1 text-[11px] font-semibold text-amarelo-900 ring-1 ring-amarelo-300">
                <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
                </svg>
                Nasceu de um relato da população
              </span>
            )}
          </div>
        </Link>
      </motion.div>
    </motion.li>
  )
}
