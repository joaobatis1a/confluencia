import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Projeto } from '../../../types/database'
import Contador from '../../../components/Contador'
import { dataLocal } from '../etapas'
import { formatarReais, reaisCurto, type ConteudoProjeto, type Estimativa, type Midia } from '../conteudo'

const Rotulo = ({ children }: { children: string }) => (
  <p className="text-xs font-bold uppercase tracking-[0.14em] text-amarelo-700">{children}</p>
)

function Credito({ midia, claro = false }: { midia: Midia; claro?: boolean }) {
  return (
    <a
      href={midia.fonte}
      target="_blank"
      rel="noreferrer"
      className={`text-[11px] underline-offset-2 hover:underline ${claro ? 'text-white/70' : 'text-grafite-500'}`}
    >
      {midia.ilustrativa && <b className={claro ? 'text-amarelo-300' : 'text-amarelo-700'}>Foto ilustrativa · </b>}
      {midia.autor} · {midia.licenca}
    </a>
  )
}

// --- A proposta completa ---------------------------------------------------
export function SecaoProposta({ conteudo }: { conteudo: ConteudoProjeto }) {
  return (
    <section className="mt-16">
      <Rotulo>A proposta completa</Rotulo>
      <div className="mt-6 rounded-[28px] bg-grafite-100 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-grafite-500">O problema hoje</p>
        <p className="mt-2 text-lg leading-relaxed text-grafite-900">{conteudo.problema}</p>
      </div>
      <ul className="mt-8 space-y-5">
        {conteudo.proposta.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-4"
          >
            <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amarelo-500 text-grafite-900">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="text-lg leading-relaxed text-grafite-800">{item}</p>
          </motion.li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-2">
        {conteudo.beneficios.map((b, i) => (
          <motion.span
            key={b}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 400, damping: 18 }}
            className="rounded-full bg-status-verde-50 px-4 py-2 text-sm font-semibold text-status-verde-700"
          >
            ✓ {b}
          </motion.span>
        ))}
      </div>
    </section>
  )
}

// --- Estimativa ------------------------------------------------------------
export function CartaoEstimativa({ estimativa, projeto }: { estimativa: Estimativa; projeto: Projeto }) {
  const concluido = projeto.status === 'concluido'
  const final = estimativa.custoFinal
  const variacao = final ? Math.round(((final - estimativa.custo) / estimativa.custo) * 100) : null
  const inicio = dataLocal(estimativa.inicioPrevisto).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <section className="mt-16">
      <Rotulo>{concluido ? 'Quanto custou' : 'Estimativa'}</Rotulo>
      <div className="mt-6 overflow-hidden rounded-[28px] border border-grafite-200 bg-white">
        <div className="grid gap-px bg-grafite-200 sm:grid-cols-3">
          <div className="bg-white p-6">
            <p className="text-sm text-grafite-500">{concluido ? 'Custo estimado' : 'Custo previsto'}</p>
            <p className="mt-1 font-heading text-4xl font-extrabold text-grafite-900">{reaisCurto(estimativa.custo)}</p>
            <p className="text-xs text-grafite-500">{formatarReais(estimativa.custo)}</p>
          </div>
          <div className="bg-white p-6">
            <p className="text-sm text-grafite-500">Prazo de obra</p>
            <p className="mt-1 font-heading text-4xl font-extrabold text-grafite-900">
              <Contador valor={estimativa.prazoMeses} /> <span className="text-2xl">meses</span>
            </p>
            <p className="text-xs text-grafite-500">{concluido ? 'começou em' : 'início previsto em'} {inicio}</p>
          </div>
          <div className="bg-white p-6">
            <p className="text-sm text-grafite-500">De onde vem o dinheiro</p>
            <p className="mt-2 font-semibold leading-snug text-grafite-900">{estimativa.origemRecurso}</p>
          </div>
        </div>
        {final && variacao !== null && (
          <div className="bg-amarelo-50 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-grafite-900">
                Custo final: <span className="font-heading text-2xl font-extrabold">{reaisCurto(final)}</span>
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  variacao > 0 ? 'bg-status-terracota-50 text-status-terracota-700' : 'bg-status-verde-50 text-status-verde-700'
                }`}
              >
                {variacao > 0 ? `${variacao}% acima do previsto` : variacao < 0 ? `${-variacao}% abaixo do previsto` : 'dentro do previsto'}
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
              <motion.div
                className="h-full rounded-full bg-amarelo-500"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(100, (estimativa.custo / Math.max(final, estimativa.custo)) * 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-1 text-xs text-grafite-500">Barra amarela: o previsto em relação ao que foi gasto.</p>
          </div>
        )}
      </div>
    </section>
  )
}

// --- Fotos da obra (com ampliação) -----------------------------------------
export function GaleriaObra({ fotos }: { fotos: Midia[] }) {
  const [aberta, setAberta] = useState<number | null>(null)

  useEffect(() => {
    if (aberta === null) return
    const tecla = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setAberta(null)
      if (e.key === 'ArrowRight') setAberta((i) => (i === null ? i : (i + 1) % fotos.length))
      if (e.key === 'ArrowLeft') setAberta((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length))
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aberta, fotos.length])

  return (
    <section className="mt-16">
      <Rotulo>Fotos da obra</Rotulo>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {fotos.map((foto, i) => (
          <motion.button
            key={foto.url}
            type="button"
            layoutId={`foto-obra-${i}`}
            onClick={() => setAberta(i)}
            initial={{ opacity: 0, y: 24, rotate: i % 2 ? 2 : -2 }}
            whileInView={{ opacity: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }}
            whileHover={{ rotate: 0, scale: 1.03 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.08 }}
            className={`group overflow-hidden rounded-2xl bg-white p-2 text-left shadow-[0_14px_30px_-16px_rgba(27,24,19,0.45)] ${
              i === 0 ? 'col-span-2 sm:col-span-1 sm:row-span-2' : ''
            }`}
          >
            <img
              src={foto.url}
              alt={foto.legenda}
              loading="lazy"
              className={`w-full rounded-xl object-cover grayscale-[0.5] transition-[filter] duration-500 group-hover:grayscale-0 ${
                i === 0 ? 'h-56 sm:h-full sm:min-h-[22rem]' : 'h-40'
              }`}
            />
            <span className="mt-2 block px-1 text-[11px] font-bold uppercase leading-tight tracking-[0.08em] text-grafite-700">
              {foto.legenda}
            </span>
            <span className="block px-1 pb-1">
              <Credito midia={foto} />
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {aberta !== null && (
          <motion.div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-grafite-900/85 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAberta(null)}
            role="dialog"
            aria-modal="true"
            aria-label={fotos[aberta].legenda}
          >
            <motion.figure
              layoutId={`foto-obra-${aberta}`}
              className="max-w-5xl overflow-hidden rounded-3xl bg-white p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={fotos[aberta].url} alt={fotos[aberta].legenda} className="max-h-[75vh] w-full rounded-2xl object-contain" />
              <figcaption className="flex flex-wrap items-center justify-between gap-2 px-2 pt-3">
                <span className="text-sm font-semibold text-grafite-900">{fotos[aberta].legenda}</span>
                <Credito midia={fotos[aberta]} />
              </figcaption>
            </motion.figure>
            <button
              type="button"
              onClick={() => setAberta(null)}
              aria-label="Fechar"
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-grafite-900"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// --- Antes e depois (fotos, arrastável) ------------------------------------
export function ComparadorFotos({ antes, depois }: { antes: Midia; depois: Midia }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)
  const [arrastando, setArrastando] = useState(false)

  function mover(e: PointerEvent<HTMLDivElement>) {
    if (!arrastando || !caixa.current) return
    const r = caixa.current.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))
  }
  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
    if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
  }

  return (
    <section className="mt-16">
      <Rotulo>Antes e depois</Rotulo>
      <div
        ref={caixa}
        className="relative mt-6 aspect-[16/10] select-none overflow-hidden rounded-[28px] touch-none bg-grafite-200"
        onPointerMove={mover}
        onPointerUp={() => setArrastando(false)}
        onPointerLeave={() => setArrastando(false)}
      >
        <img src={antes.url} alt={antes.legenda} className="absolute inset-0 h-full w-full object-cover sepia-[0.35]" draggable={false} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <img src={depois.url} alt={depois.legenda} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        </div>
        <span className="absolute left-4 top-4 rounded-full bg-grafite-900/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          Antes
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-amarelo-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-grafite-900">
          Depois
        </span>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparar antes e depois"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={teclado}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setArrastando(true)
          }}
          onPointerMove={mover}
          onPointerUp={() => setArrastando(false)}
          className="absolute inset-y-0 z-10 -ml-6 flex w-12 cursor-ew-resize items-center justify-center focus:outline-none"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.4)]" />
          <motion.span
            animate={arrastando ? { scale: 1.15 } : { scale: [1, 1.08, 1] }}
            transition={arrastando ? { duration: 0.15 } : { duration: 1.6, repeat: Infinity }}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-grafite-900 shadow-lg ring-4 ring-amarelo-500/40"
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
              <path d="m9 6-6 6 6 6M15 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
        <span className="text-grafite-700">
          <b>Antes:</b> {antes.legenda} — <Credito midia={antes} />
        </span>
        <span className="text-grafite-700">
          <b>Depois:</b> {depois.legenda} — <Credito midia={depois} />
        </span>
      </div>
    </section>
  )
}

// --- Vídeos antes / depois -------------------------------------------------
function Video({ midia, rotulo }: { midia: Midia; rotulo: 'Antes' | 'Depois' }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [tocando, setTocando] = useState(false)
  const [duracao, setDuracao] = useState<number | null>(null)
  const textoDuracao =
    duracao === null ? '' : duracao >= 60 ? `${Math.round(duracao / 60)} min` : `${Math.round(duracao)} s`

  return (
    <figure className="group">
      <div className="relative overflow-hidden rounded-[24px] bg-grafite-900">
        <video
          ref={ref}
          src={midia.url}
          preload="metadata"
          playsInline
          controls={tocando}
          onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
          onPlay={() => setTocando(true)}
          onPause={() => setTocando(false)}
          className={`aspect-video w-full object-cover ${rotulo === 'Antes' ? 'sepia-[0.3]' : ''}`}
        />
        {!tocando && (
          <button
            type="button"
            onClick={() => ref.current?.play()}
            aria-label={`Assistir: ${midia.legenda}`}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-black/10"
          >
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-amarelo-500 text-grafite-900 shadow-xl"
            >
              <svg viewBox="0 0 24 24" width={26} height={26} fill="currentColor" aria-hidden>
                <path d="M8 5.5v13l11-6.5-11-6.5Z" />
              </svg>
            </motion.span>
            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                rotulo === 'Antes' ? 'bg-grafite-900/80 text-white' : 'bg-amarelo-500 text-grafite-900'
              }`}
            >
              {rotulo}
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 text-sm font-semibold text-grafite-900">
        {midia.legenda}
        {textoDuracao && <span className="ml-2 font-normal text-grafite-500">· {textoDuracao}</span>}
        <span className="block font-normal">
          <Credito midia={midia} />
        </span>
      </figcaption>
    </figure>
  )
}

export function VideosAntesDepois({ videos }: { videos: NonNullable<ConteudoProjeto['videos']> }) {
  return (
    <section className="mt-16">
      <Rotulo>Vídeos</Rotulo>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {videos.antes && <Video midia={videos.antes} rotulo="Antes" />}
        {videos.depois && <Video midia={videos.depois} rotulo="Depois" />}
      </div>
    </section>
  )
}
