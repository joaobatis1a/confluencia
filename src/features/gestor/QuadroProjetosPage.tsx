import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORIAS, STATUS_LABELS, type Projeto, type ProjetoStatus, type VotosResultado } from '../../types/database'
import { CATEGORIA_RGB } from '../feed/cores'
import IconeCategoria from '../feed/components/IconeCategoria'
import StatusBadge from '../../components/StatusBadge'
import { ETAPAS_PUBLICAS, dataLocal, diasRestantes, indiceEtapa, marcosCumpridos, proximoMarco } from '../projetos/etapas'
import { fotoDoProjeto } from '../projetos/fotos'
import { hojeIso, situacaoDoMarco } from '../projetos/timeline'
import AtualizacaoForm from '../projetos/components/AtualizacaoForm'
import HistoricoAtualizacoes from '../projetos/components/HistoricoAtualizacoes'
import { marcosAtrasados, useProjetosGestor } from './dados'
import { CountUp } from './graficos'
import CentralShell, { KpiCard } from './CentralShell'

// Quadro do órgão: os projetos do próprio órgão, com o que importa à vista
// (etapa, votos, próximo marco, atrasos). Clicar num cartão abre o detalhe
// com a linha do tempo e o formulário de atualização.

type Filtro = ProjetoStatus | 'todos' | 'atencao'

const ESTAGIOS: ProjetoStatus[] = [...ETAPAS_PUBLICAS.map((e) => e.status), 'rejeitado']

export default function QuadroProjetosPage() {
  const { projetos, resultados, erro, trocar } = useProjetosGestor()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [aberto, setAberto] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [agora] = useState(() => Date.now())
  const lista = useMemo(() => projetos ?? [], [projetos])

  const atencao = (p: Projeto) => marcosAtrasados(p) > 0 || (p.status === 'em_consulta' && (diasRestantes(p, agora) ?? 99) <= 7)
  const visiveis = useMemo(() => {
    const base = lista.filter((p) => (filtro === 'todos' ? true : filtro === 'atencao' ? atencao(p) : p.status === filtro))
    // O que pede ação vem primeiro; depois, do mais perto da entrega ao mais longe.
    return [...base].sort((a, b) => Number(atencao(b)) - Number(atencao(a)) || indiceEtapa(b.status) - indiceEtapa(a.status))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, filtro])
  const selecionado = lista.find((p) => p.id === aberto) ?? null
  const votos = Object.values(resultados).reduce((s, r) => s + r.total_votos, 0)

  const opcoes: { valor: Filtro; rotulo: string; qtd: number }[] = [
    { valor: 'todos', rotulo: 'Todos', qtd: lista.length },
    { valor: 'atencao', rotulo: 'Pedem atenção', qtd: lista.filter(atencao).length },
    ...ESTAGIOS.map((s) => ({ valor: s as Filtro, rotulo: STATUS_LABELS[s], qtd: lista.filter((p) => p.status === s).length })),
  ]

  return (
    <CentralShell
      kicker="Quadro de projetos"
      titulo="Do papel à entrega"
      sub="Os projetos do seu órgão, com o que está andando, o que está atrasado e o que a população já votou."
      acoes={
        <Link to="/projetos/novo" className="inline-flex items-center gap-2 rounded-full bg-grafite-900 px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
          <span className="text-lg leading-none text-amarelo-500">+</span> Novo projeto
        </Link>
      }
    >
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard indice={0} tom="azul" icone="pasta" valor={<CountUp valor={lista.length} />} rotulo="projetos" frase="do seu órgão" ativo={filtro === 'todos'} onClick={() => setFiltro('todos')} />
        <KpiCard indice={1} tom="amarelo" icone="voto" valor={<CountUp valor={votos} />} rotulo={votos === 1 ? 'voto' : 'votos'} frase="nas consultas" ativo={filtro === 'em_consulta'} onClick={() => setFiltro('em_consulta')} />
        <KpiCard indice={2} tom="vermelho" icone="alerta" valor={<CountUp valor={lista.filter(atencao).length} />} rotulo="pedem atenção" frase="atraso ou prazo curto" ativo={filtro === 'atencao'} onClick={() => setFiltro('atencao')} />
        <KpiCard indice={3} tom="verde" icone="obra" valor={<CountUp valor={lista.filter((p) => p.status === 'em_execucao').length} />} rotulo="em execução" frase="obras andando" ativo={filtro === 'em_execucao'} onClick={() => setFiltro('em_execucao')} />
      </div>

      {/* Filtro por etapa */}
      <div role="radiogroup" aria-label="Filtrar projetos" className="mt-6 flex flex-wrap gap-1.5 rounded-[28px] bg-white p-3 shadow-[0_2px_8px_-4px_rgba(27,24,19,0.12)] ring-1 ring-grafite-200">
        {opcoes.map((o) => {
          const ativo = filtro === o.valor
          return (
            <button key={o.valor} type="button" role="radio" aria-checked={ativo} disabled={o.qtd === 0 && !ativo} onClick={() => setFiltro(o.valor)} className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${ativo ? 'text-grafite-900' : 'text-grafite-500 hover:text-grafite-900'}`}>
              {ativo && <motion.span layoutId="filtro-quadro" className="absolute inset-0 rounded-full bg-amarelo-500" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">
                {o.rotulo} <span className={ativo ? '' : 'text-grafite-500'}>{o.qtd}</span>
              </span>
            </button>
          )
        })}
      </div>

      {aviso && (
        <motion.p role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl bg-status-verde-50 p-4 text-sm font-semibold text-status-verde-700">
          {aviso}
        </motion.p>
      )}

      {erro ? (
        <p className="mt-8 rounded-[24px] bg-status-vermelho-50 p-6 text-sm text-status-vermelho-700">Não foi possível carregar seus projetos: {erro}</p>
      ) : projetos === null ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-80 animate-pulse rounded-[28px] bg-grafite-100" />
          ))}
        </ul>
      ) : visiveis.length === 0 ? (
        <div className="mt-6 rounded-[28px] border-2 border-dashed border-grafite-200 bg-white/60 px-6 py-16 text-center">
          <p className="font-heading text-2xl font-bold text-grafite-900">{lista.length === 0 ? 'Nenhum projeto ainda' : 'Nenhum projeto neste filtro'}</p>
          <p className="mt-1 text-sm text-grafite-500">{lista.length === 0 ? 'Comece por um relato da Central, ou crie um projeto do zero.' : 'Escolha outra etapa acima.'}</p>
          <Link to="/projetos/novo" className="mt-5 inline-flex rounded-full bg-amarelo-500 px-6 py-3 text-sm font-bold text-grafite-900">
            Publicar um projeto
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visiveis.map((p, i) => (
              <Cartao key={p.id} projeto={p} resultado={resultados[p.id]} agora={agora} indice={i} atencao={atencao(p)} onAbrir={() => { setAviso(null); setAberto(p.id) }} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {selecionado && (
          <Gaveta
            key={selecionado.id}
            projeto={selecionado}
            resultado={resultados[selecionado.id]}
            agora={agora}
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

function Capa({ projeto: p, className = 'h-36' }: { projeto: Projeto; className?: string }) {
  const [r, g, b] = CATEGORIA_RGB[p.categoria]
  const foto = fotoDoProjeto(p.id)
  return (
    <span className={`relative block overflow-hidden ${className}`} style={{ background: `rgb(${r} ${g} ${b})` }}>
      {foto ? (
        <img src={foto.url} alt="" loading="lazy" className={`h-full w-full object-cover ${p.status === 'rejeitado' ? 'grayscale' : ''}`} />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-white/90">
          <span className="absolute inset-0 opacity-25 [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:18px_18px]" />
          <IconeCategoria categoria={p.categoria} size={40} />
        </span>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
    </span>
  )
}

function Trilho({ projeto: p }: { projeto: Projeto }) {
  const etapa = indiceEtapa(p.status)
  if (p.status === 'rejeitado') return <p className="text-sm font-semibold text-status-vermelho-700">Rejeitado. Só o órgão vê este projeto.</p>
  return (
    <ol className="flex gap-1" aria-label={`Etapa: ${STATUS_LABELS[p.status]}`}>
      {ETAPAS_PUBLICAS.map((e, i) => (
        <li key={e.status} className="flex-1">
          <span className={`block h-1.5 rounded-full ${i <= etapa ? 'bg-amarelo-500' : 'bg-grafite-200'}`} />
          <span className={`mt-1 hidden text-[10px] sm:block ${i === etapa ? 'font-bold text-grafite-900' : 'text-grafite-500'}`}>{e.label}</span>
        </li>
      ))}
    </ol>
  )
}

function Cartao({ projeto: p, resultado, agora, indice, atencao, onAbrir }: { projeto: Projeto; resultado?: VotosResultado; agora: number; indice: number; atencao: boolean; onAbrir: () => void }) {
  const atrasados = marcosAtrasados(p)
  const proximo = proximoMarco(p)
  const dias = diasRestantes(p, agora)
  const total = resultado?.total_votos ?? 0
  const pct = total ? Math.round((resultado!.votos_favor / total) * 100) : 0
  const categoria = CATEGORIAS.find((c) => c.value === p.categoria)?.label
  return (
    <motion.li layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 28, delay: Math.min(indice, 8) * 0.05 }}>
      <button
        type="button"
        onClick={onAbrir}
        className="group flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-white text-left shadow-[0_2px_8px_-4px_rgba(27,24,19,0.12)] ring-1 ring-grafite-200 transition-all hover:-translate-y-1 hover:shadow-[0_26px_44px_-26px_rgba(27,24,19,0.5)] focus-visible:ring-2 focus-visible:ring-amarelo-500"
      >
        <span className="relative block">
          <Capa projeto={p} />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-grafite-900">{categoria}</span>
          {atencao && <span className="absolute right-4 top-4 rounded-full bg-status-vermelho-500 px-3 py-1 text-xs font-bold text-white shadow">pede atenção</span>}
        </span>
        <span className="flex flex-1 flex-col p-5">
          <span className="flex items-start justify-between gap-3">
            <span className="font-heading text-lg font-extrabold leading-tight text-grafite-900">{p.nome}</span>
          </span>
          <span className="mt-2 block">
            <StatusBadge status={p.status} />
          </span>
          <span className="mt-2 line-clamp-2 block text-sm text-grafite-700">{p.descricao}</span>

          <span className="mt-4 block">
            <Trilho projeto={p} />
          </span>

          {p.status === 'em_consulta' && (
            <span className="mt-4 block rounded-2xl bg-grafite-50 p-3 ring-1 ring-grafite-100">
              <span className="flex justify-between text-xs font-bold">
                <span className="text-status-verde-700">{total ? `${pct}% a favor` : 'Sem votos ainda'}</span>
                <span className="text-grafite-500">
                  {total.toLocaleString('pt-BR')} {total === 1 ? 'voto' : 'votos'}
                </span>
              </span>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-grafite-200">
                <span className="block h-full rounded-full bg-status-verde-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </span>
              {dias !== null && <span className="mt-1.5 block text-xs text-grafite-500">{dias === 0 ? 'A consulta termina hoje' : `A consulta termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}`}</span>}
            </span>
          )}

          <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-4 text-xs text-grafite-500">
            {atrasados > 0 && (
              <span className="rounded-full bg-status-vermelho-50 px-2.5 py-1 font-bold text-status-vermelho-700">
                {atrasados} {atrasados === 1 ? 'marco atrasado' : 'marcos atrasados'}
              </span>
            )}
            {proximo && p.status !== 'rejeitado' && (
              <span>
                Próximo: <b className="text-grafite-900">{proximo.nome}</b>, {dataLocal(proximo.data_prevista).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            )}
            <span className="ml-auto font-bold text-grafite-900 transition-transform group-hover:translate-x-1">Abrir →</span>
          </span>
        </span>
      </button>
    </motion.li>
  )
}

function Gaveta({ projeto: p, resultado, agora, onFechar, onPublicada }: { projeto: Projeto; resultado?: VotosResultado; agora: number; onFechar: () => void; onPublicada: (p: Projeto) => void }) {
  const [hoje] = useState(hojeIso)
  const feitos = marcosCumpridos(p)
  const dias = diasRestantes(p, agora)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])
  return (
    <motion.div className="fixed inset-0 z-[2000] flex justify-end bg-grafite-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onFechar} role="dialog" aria-modal="true" aria-label={p.nome}>
      <motion.aside
        onClick={(e) => e.stopPropagation()}
        initial={{ x: 520 }}
        animate={{ x: 0 }}
        exit={{ x: 520 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="h-full w-full max-w-lg overflow-y-auto bg-grafite-50 [scrollbar-width:none]"
      >
        <div className="relative">
          <Capa projeto={p} className="h-48" />
          <button type="button" onClick={onFechar} aria-label="Fechar" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg shadow transition-transform hover:scale-105">
            ×
          </button>
        </div>
        <div className="space-y-5 p-6">
          <div>
            <StatusBadge status={p.status} />
            <h2 className="mt-2 font-heading text-3xl font-extrabold leading-tight text-grafite-900">{p.nome}</h2>
            <p className="mt-2 text-[15px] text-grafite-700">{p.descricao}</p>
          </div>

          <Trilho projeto={p} />

          <div className="grid grid-cols-3 gap-3">
            {[
              { v: resultado?.total_votos ?? 0, l: 'votos' },
              { v: resultado?.total_votos ? `${Math.round((resultado.votos_favor / resultado.total_votos) * 100)}%` : '–', l: 'a favor' },
              { v: `${feitos}/${p.timeline.length}`, l: 'marcos' },
            ].map((n) => (
              <div key={n.l} className="rounded-2xl bg-white p-3 text-center ring-1 ring-grafite-200">
                <p className="font-heading text-2xl font-extrabold text-grafite-900">{n.v}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-grafite-500">{n.l}</p>
              </div>
            ))}
          </div>
          {p.status === 'em_consulta' && dias !== null && <p className="rounded-2xl bg-status-azul-50 px-4 py-3 text-sm font-semibold text-status-azul-700">{dias === 0 ? 'A consulta termina hoje.' : `A consulta termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`}</p>}

          {p.timeline.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-grafite-500">Linha do tempo</h3>
              <ol className="relative mt-3 space-y-3 border-l-2 border-dashed border-grafite-300 pl-5">
                {p.timeline.map((m) => {
                  const s = situacaoDoMarco(m, hoje).situacao
                  return (
                    <li key={m.nome} className="relative text-sm">
                      <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${s === 'atrasado' ? 'bg-status-vermelho-500' : m.data_real ? 'bg-status-verde-500' : 'bg-grafite-300'}`} />
                      <b className="text-grafite-900">{m.nome}</b>
                      <span className="text-grafite-500">
                        {' '}
                        · {m.data_real ? 'feito em ' : 'previsto para '}
                        {dataLocal(m.data_real ?? m.data_prevista).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {s === 'atrasado' && <span className="ml-1 rounded-full bg-status-vermelho-50 px-2 py-0.5 text-[11px] font-bold text-status-vermelho-700">atrasado</span>}
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          <section className="rounded-[24px] bg-white p-5 ring-1 ring-grafite-200">
            <AtualizacaoForm projeto={p} onPublicada={onPublicada} onCancelar={onFechar} />
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-grafite-500">Já publicado</h3>
            <HistoricoAtualizacoes projetoId={p.id} />
          </section>

          <Link to={`/projetos/${p.id}`} className="inline-block text-sm font-bold text-amarelo-700 hover:underline">
            Abrir a página pública do projeto →
          </Link>
        </div>
      </motion.aside>
    </motion.div>
  )
}
