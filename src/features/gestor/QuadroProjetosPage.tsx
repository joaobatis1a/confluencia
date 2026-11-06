import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORIAS, STATUS_LABELS, type Projeto, type ProjetoStatus, type VotosResultado } from '../../types/database'
import { CATEGORIA_RGB, rgb } from '../feed/cores'
import IconeCategoria from '../feed/components/IconeCategoria'
import { dataLocal, diasRestantes, marcosCumpridos, proximoMarco } from '../projetos/etapas'
import { hojeIso, situacaoDoMarco } from '../projetos/timeline'
import AtualizacaoForm from '../projetos/components/AtualizacaoForm'
import { marcosAtrasados, useProjetosGestor } from './dados'
import CentralShell from './CentralShell'

// Quadro do órgão: os projetos do próprio órgão em colunas, do que está
// começando ao que foi entregue. Clicar num cartão abre a gaveta com a linha
// do tempo e o formulário de atualização.

const COLUNAS: { status: ProjetoStatus; cor: string; dica: string }[] = [
  { status: 'proposto', cor: '#7c776c', dica: 'ideias e propostas' },
  { status: 'em_consulta', cor: '#2e5fcf', dica: 'a população vota' },
  { status: 'aprovado', cor: '#17a34a', dica: 'aguardando início' },
  { status: 'em_execucao', cor: '#f5b800', dica: 'obra em andamento' },
  { status: 'concluido', cor: '#17a34a', dica: 'entregues' },
  { status: 'rejeitado', cor: '#d63b2f', dica: 'só o órgão vê' },
]

export default function QuadroProjetosPage() {
  const { projetos, resultados, erro, trocar } = useProjetosGestor()
  const [aberto, setAberto] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [agora] = useState(() => Date.now())
  const lista = projetos ?? []
  const selecionado = lista.find((p) => p.id === aberto) ?? null

  return (
    <CentralShell
      kicker="Quadro de projetos"
      titulo="Do papel à entrega"
      sub="Os projetos do seu órgão, por etapa. Abra um cartão para publicar atualização e avisar quem acompanha."
      verComoMorador="/projetos"
      acoes={
        <Link to="/projetos/novo" className="inline-flex items-center gap-2 rounded-full bg-amarelo-500 px-6 py-3 text-sm font-bold text-grafite-900 transition-transform hover:-translate-y-0.5">
          <span className="text-lg leading-none">+</span> Novo projeto
        </Link>
      }
    >
      {aviso && (
        <motion.p role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl bg-status-verde-500/15 p-4 text-sm font-semibold text-status-verde-500">
          {aviso}
        </motion.p>
      )}
      {erro ? (
        <p className="mt-10 rounded-[24px] bg-status-vermelho-500/15 p-6 text-sm text-status-vermelho-500">Não foi possível carregar seus projetos: {erro}</p>
      ) : projetos === null ? (
        <div className="mt-10 flex gap-4 overflow-hidden" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-72 w-72 shrink-0 animate-pulse rounded-[24px] bg-white/[0.05]" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="mt-10 rounded-[24px] border-2 border-dashed border-white/15 px-6 py-16 text-center">
          <p className="font-heading text-2xl font-bold">Nenhum projeto ainda</p>
          <p className="mt-1 text-sm text-white/50">Comece por um relato da Central, ou crie um projeto do zero.</p>
          <Link to="/projetos/novo" className="mt-6 inline-flex rounded-full bg-amarelo-500 px-6 py-3 text-sm font-bold text-grafite-900">
            Publicar o primeiro
          </Link>
        </div>
      ) : (
        <div className="-mx-5 mt-10 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 [scrollbar-width:thin]">
          <div className="flex min-w-max gap-4">
            {COLUNAS.map((col) => {
              const itens = lista.filter((p) => p.status === col.status)
              return (
                <section key={col.status} className="w-[300px] shrink-0" aria-label={STATUS_LABELS[col.status]}>
                  <header className="mb-3 flex items-center gap-2 px-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.cor }} />
                    <h2 className="text-sm font-bold">{STATUS_LABELS[col.status]}</h2>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold tabular-nums">{itens.length}</span>
                    <span className="ml-auto text-xs text-white/35">{col.dica}</span>
                  </header>
                  <div className="min-h-[120px] space-y-3 rounded-[24px] bg-white/[0.03] p-2.5 ring-1 ring-white/[0.06]">
                    {itens.length === 0 && <p className="px-3 py-8 text-center text-xs text-white/30">Vazio</p>}
                    {itens.map((p, i) => (
                      <Cartao key={p.id} projeto={p} resultado={resultados[p.id]} agora={agora} indice={i} onAbrir={() => { setAviso(null); setAberto(p.id) }} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selecionado && (
          <Gaveta
            key={selecionado.id}
            projeto={selecionado}
            resultado={resultados[selecionado.id]}
            onFechar={() => setAberto(null)}
            onPublicada={(p) => {
              trocar(p)
              setAberto(null)
              setAviso(`Atualização publicada em "${p.nome}".`)
            }}
          />
        )}
      </AnimatePresence>
    </CentralShell>
  )
}

function Cartao({ projeto: p, resultado, agora, indice, onAbrir }: { projeto: Projeto; resultado?: VotosResultado; agora: number; indice: number; onAbrir: () => void }) {
  const cor = rgb(CATEGORIA_RGB[p.categoria])
  const atrasados = marcosAtrasados(p)
  const proximo = proximoMarco(p)
  const dias = diasRestantes(p, agora)
  const total = resultado?.total_votos ?? 0
  const pct = total ? Math.round((resultado!.votos_favor / total) * 100) : 0
  const feitos = marcosCumpridos(p)
  return (
    <motion.button
      type="button"
      layout
      onClick={onAbrir}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: indice * 0.05 }}
      whileHover={{ y: -3 }}
      className="block w-full overflow-hidden rounded-[20px] bg-white/[0.07] text-left ring-1 ring-white/10 transition-colors hover:bg-white/[0.11] focus-visible:ring-2 focus-visible:ring-amarelo-500"
    >
      <span className="block h-1.5" style={{ background: cor }} />
      <span className="block p-4">
        <span className="flex items-center gap-2 text-xs text-white/55">
          <span className="grid h-6 w-6 place-items-center rounded-lg text-white" style={{ background: cor }}>
            <IconeCategoria categoria={p.categoria} size={14} />
          </span>
          {CATEGORIAS.find((c) => c.value === p.categoria)?.label}
          {atrasados > 0 && <span className="ml-auto rounded-full bg-status-vermelho-500/20 px-2 py-0.5 font-bold text-status-vermelho-500">{atrasados} atrasado{atrasados > 1 ? 's' : ''}</span>}
        </span>
        <span className="mt-2.5 block font-heading text-base font-extrabold leading-tight">{p.nome}</span>
        {p.status === 'em_consulta' && (
          <span className="mt-3 block">
            <span className="flex justify-between text-[11px] font-semibold text-white/60">
              <span>{total ? `${pct}% a favor` : 'Sem votos ainda'}</span>
              <span>{total.toLocaleString('pt-BR')} {total === 1 ? 'voto' : 'votos'}</span>
            </span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-status-verde-500" style={{ width: `${pct}%` }} />
            </span>
            {dias !== null && <span className="mt-1.5 block text-[11px] text-white/45">{dias === 0 ? 'Termina hoje' : `Termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}`}</span>}
          </span>
        )}
        {proximo && p.status !== 'rejeitado' && (
          <span className="mt-3 block text-[11px] text-white/50">
            Próximo: <b className="text-white/85">{proximo.nome}</b> · {dataLocal(proximo.data_prevista).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        )}
        {p.timeline.length > 0 && (
          <span className="mt-2.5 flex gap-1" aria-label={`${feitos} de ${p.timeline.length} marcos cumpridos`}>
            {p.timeline.map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < feitos ? 'bg-amarelo-500' : 'bg-white/15'}`} />
            ))}
          </span>
        )}
      </span>
    </motion.button>
  )
}

function Gaveta({ projeto: p, resultado, onFechar, onPublicada }: { projeto: Projeto; resultado?: VotosResultado; onFechar: () => void; onPublicada: (p: Projeto) => void }) {
  const [hoje] = useState(hojeIso)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])
  return (
    <motion.div className="fixed inset-0 z-[2000] flex justify-end bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onFechar} role="dialog" aria-modal="true" aria-label={p.nome}>
      <motion.aside
        onClick={(e) => e.stopPropagation()}
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        exit={{ x: 480 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 text-grafite-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-grafite-500">{STATUS_LABELS[p.status]}</p>
            <h2 className="mt-1 font-heading text-2xl font-extrabold leading-tight">{p.nome}</h2>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-grafite-500 hover:bg-grafite-100">
            ×
          </button>
        </div>
        <p className="mt-3 text-sm text-grafite-700">{p.descricao}</p>
        {resultado && resultado.total_votos > 0 && (
          <p className="mt-4 rounded-2xl bg-grafite-50 px-4 py-3 text-sm">
            <b>{Math.round((resultado.votos_favor / resultado.total_votos) * 100)}% a favor</b> · {resultado.total_votos.toLocaleString('pt-BR')} votos
          </p>
        )}
        {p.timeline.length > 0 && (
          <ol className="mt-5 space-y-2 border-l-2 border-dashed border-grafite-200 pl-4">
            {p.timeline.map((m) => {
              const s = situacaoDoMarco(m, hoje).situacao
              return (
                <li key={m.nome} className="relative text-sm">
                  <span className={`absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full ${s === 'atrasado' ? 'bg-status-vermelho-500' : m.data_real ? 'bg-status-verde-500' : 'bg-grafite-300'}`} />
                  <b>{m.nome}</b>
                  <span className="text-grafite-500"> · {dataLocal(m.data_real ?? m.data_prevista).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  {s === 'atrasado' && <span className="ml-1 text-xs font-bold text-status-vermelho-700">atrasado</span>}
                </li>
              )
            })}
          </ol>
        )}
        <div className="mt-6 border-t border-grafite-200 pt-5">
          <AtualizacaoForm projeto={p} onPublicada={onPublicada} onCancelar={onFechar} />
        </div>
        <Link to={`/projetos/${p.id}`} className="mt-5 inline-block text-sm font-semibold text-amarelo-700 hover:underline">
          Abrir a página pública do projeto →
        </Link>
      </motion.aside>
    </motion.div>
  )
}
