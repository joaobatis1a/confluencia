import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../../context/AuthContext'
import { CATEGORIA_RGB, rgb } from '../../feed/cores'
import IconeCategoria from '../../feed/components/IconeCategoria'
import { nivelRepercussao } from '../../../lib/repercussao'
import { CATEGORIAS, STATUS_LABELS, type Categoria, type Projeto } from '../../../types/database'
import { diasRestantes, indiceEtapa, proximoMarco, dataLocal, ETAPAS_PUBLICAS } from '../etapas'
import { diasDesde, faseDoRelato, marcosAtrasados, useProjetosGestor, useRelatosGestor } from '../../gestor/dados'
import { BarrasBairros, CountUp, Painel, RoscaCategorias, Sparkline } from '../../gestor/graficos'
import CentralShell, { Icone, KpiCard, Secao, TOM, type NomeIcone, type Tom } from '../../gestor/CentralShell'

// Painel do órgão: a visão geral em três blocos, de cima para baixo:
// 1. os números; 2. o que precisa de ação hoje; 3. como a cidade e os projetos estão.
// O trabalho em si acontece na Central de relatos e no Quadro de projetos.
// Protegido por RequireInstitutional em App.tsx + RLS no banco.

interface Alerta {
  chave: string
  tipo: 'relato' | 'prazo' | 'atraso'
  titulo: string
  detalhe: string
  to: string
  categoria: Categoria
  rotuloAcao: string
}

const TIPO: Record<Alerta['tipo'], { rotulo: string; tom: Tom; icone: NomeIcone }> = {
  relato: { rotulo: 'Relato sem resposta', tom: 'vermelho', icone: 'alerta' },
  prazo: { rotulo: 'Consulta acabando', tom: 'azul', icone: 'voto' },
  atraso: { rotulo: 'Marco atrasado', tom: 'amarelo', icone: 'relogio' },
}

const saudacao = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export default function PainelGestorPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { relatos } = useRelatosGestor()
  const { projetos, resultados, erro } = useProjetosGestor()
  const [agora] = useState(() => Date.now())
  const [ola] = useState(saudacao)
  const nome = profile?.orgao_nome ?? 'seu órgão'

  const d = useMemo(() => {
    const rel = relatos ?? []
    const proj = projetos ?? []
    const pend = rel.filter((r) => faseDoRelato(r) === 'pendente')
    const alertas: Alerta[] = []
    pend
      .filter((r) => nivelRepercussao(r.repercussao) !== 'baixa' || diasDesde(r.created_at) > 14)
      .sort((a, b) => b.repercussao - a.repercussao || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 3)
      .forEach((r) => alertas.push({ chave: r.id, tipo: 'relato', titulo: `${r.bairro}: ${r.descricao.slice(0, 80)}`, detalhe: `${r.repercussao} de repercussão · ${diasDesde(r.created_at)} dias sem resposta`, to: '/feed', categoria: r.categoria, rotuloAcao: 'Responder' }))
    proj.forEach((p) => {
      const dias = diasRestantes(p, agora)
      if (p.status === 'em_consulta' && dias !== null && dias <= 7) alertas.push({ chave: `c${p.id}`, tipo: 'prazo', titulo: p.nome, detalhe: dias === 0 ? 'A consulta termina hoje' : `A consulta termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}`, to: '/projetos', categoria: p.categoria, rotuloAcao: 'Ver projeto' })
      const atr = marcosAtrasados(p)
      if (atr > 0) alertas.push({ chave: `a${p.id}`, tipo: 'atraso', titulo: p.nome, detalhe: `${atr} ${atr === 1 ? 'marco atrasado' : 'marcos atrasados'}`, to: '/projetos', categoria: p.categoria, rotuloAcao: 'Atualizar' })
    })
    const andamento = proj.filter((p) => p.status === 'em_execucao' || p.status === 'em_consulta' || p.status === 'aprovado').slice(0, 3)
    return {
      rel,
      pend: pend.length,
      urgentes: pend.filter((r) => nivelRepercussao(r.repercussao) === 'alta').length,
      consultas: proj.filter((p) => p.status === 'em_consulta').length,
      votos: Object.values(resultados).reduce((s, r) => s + r.total_votos, 0),
      execucao: proj.filter((p) => p.status === 'em_execucao').length,
      alertas,
      andamento,
      total: proj.length,
    }
  }, [relatos, projetos, resultados, agora])

  const carregando = relatos === null || projetos === null
  const resumo = carregando
    ? 'Carregando o que mudou desde ontem…'
    : d.alertas.length === 0
      ? 'Está tudo em dia: nenhum relato esperando, prazo curto ou marco atrasado.'
      : `${d.alertas.length} ${d.alertas.length === 1 ? 'coisa precisa' : 'coisas precisam'} de você hoje.`

  return (
    <CentralShell
      kicker="Painel do órgão"
      titulo={`${ola}, ${nome.split(' ')[0]}`}
      sub={resumo}
      acoes={
        <Link to="/projetos/novo" className="inline-flex items-center gap-2 rounded-full bg-grafite-900 px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
          <span className="text-lg leading-none text-amarelo-500">+</span> Novo projeto
        </Link>
      }
    >
      {erro && <p className="mt-6 rounded-2xl bg-status-vermelho-50 p-4 text-sm text-status-vermelho-700">Não foi possível carregar os projetos: {erro}</p>}

      {/* 1. Números */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard indice={0} tom="vermelho" icone="alerta" valor={<CountUp valor={d.pend} />} rotulo="relatos sem resposta" frase={d.urgentes ? `${d.urgentes} com alta repercussão` : 'na Central de relatos'} onClick={() => navigate('/feed?fase=pendente')} />
        <KpiCard indice={1} tom="azul" icone="voto" valor={<CountUp valor={d.consultas} />} rotulo="em consulta" frase="a população está votando" onClick={() => navigate('/projetos')} />
        <KpiCard indice={2} tom="amarelo" icone="check" valor={<CountUp valor={d.votos} />} rotulo={d.votos === 1 ? 'voto recebido' : 'votos recebidos'} frase="nas suas consultas" onClick={() => navigate('/projetos')} />
        <KpiCard indice={3} tom="verde" icone="obra" valor={<CountUp valor={d.execucao} />} rotulo="em execução" frase="obras andando" onClick={() => navigate('/projetos')} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-10">
          {/* 2. Precisa de você */}
          <Secao titulo="Precisa de você hoje" nota="Do mais urgente para o menos, com o botão certo para cada caso.">
            {carregando ? (
              <ul className="space-y-3" aria-busy>
                {[0, 1, 2].map((i) => (
                  <li key={i} className="h-24 animate-pulse rounded-[24px] bg-grafite-100" />
                ))}
              </ul>
            ) : d.alertas.length === 0 ? (
              <div className="rounded-[28px] bg-status-verde-50 p-8 text-center">
                <p className="font-heading text-2xl font-extrabold text-status-verde-700">Tudo em dia</p>
                <p className="mt-1 text-sm text-status-verde-700/80">Nenhum relato urgente, prazo curto ou marco atrasado agora.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {d.alertas.map((a, i) => {
                  const t = TIPO[a.tipo]
                  return (
                    <motion.li key={a.chave} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                      <Link to={a.to} className="group relative flex items-center gap-4 overflow-hidden rounded-[24px] bg-white p-4 pl-5 shadow-[0_2px_8px_-4px_rgba(27,24,19,0.12)] ring-1 ring-grafite-200 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(27,24,19,0.45)]">
                        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: TOM[t.tom].barra }} />
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: rgb(CATEGORIA_RGB[a.categoria]) }}>
                          <IconeCategoria categoria={a.categoria} size={22} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TOM[t.tom].fundo} ${TOM[t.tom].texto}`}>
                            <Icone nome={t.icone} size={12} />
                            {t.rotulo}
                          </span>
                          <span className="mt-1 block truncate font-semibold text-grafite-900">{a.titulo}</span>
                          <span className="block text-sm text-grafite-500">{a.detalhe}</span>
                        </span>
                        <span className="hidden shrink-0 rounded-full bg-grafite-900 px-4 py-2 text-xs font-bold text-white transition-colors group-hover:bg-amarelo-500 group-hover:text-grafite-900 sm:block">{a.rotuloAcao} →</span>
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </Secao>

          {/* Projetos em andamento */}
          <Secao titulo="Projetos em andamento" nota={`${d.total} ${d.total === 1 ? 'projeto' : 'projetos'} no total`} acao={<Link to="/projetos" className="text-sm font-bold text-amarelo-700 hover:underline">Abrir o Quadro →</Link>}>
            {d.andamento.length === 0 ? (
              <p className="rounded-[24px] border-2 border-dashed border-grafite-200 p-6 text-sm text-grafite-500">Nenhum projeto em consulta, aprovado ou em execução.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-3">
                {d.andamento.map((p) => (
                  <MiniProjeto key={p.id} projeto={p} />
                ))}
              </ul>
            )}
          </Secao>
        </div>

        {/* 3. A cidade */}
        <aside className="space-y-5" aria-label="A cidade agora">
          <Painel titulo="Ritmo de relatos">
            <Sparkline relatos={d.rel} />
          </Painel>
          <Painel titulo="Onde pesa mais">
            <BarrasBairros relatos={d.rel.filter((r) => faseDoRelato(r) === 'pendente')} limite={5} />
          </Painel>
          <Painel titulo="O que a cidade relata">
            <RoscaCategorias relatos={d.rel} />
          </Painel>
          <Link to="/feed" className="flex items-center justify-between rounded-[24px] bg-amarelo-500 px-6 py-5 font-heading text-lg font-extrabold text-grafite-900 transition-transform hover:-translate-y-1">
            Ir para a Central de relatos <span aria-hidden>→</span>
          </Link>
        </aside>
      </div>
    </CentralShell>
  )
}

function MiniProjeto({ projeto: p }: { projeto: Projeto }) {
  const etapa = indiceEtapa(p.status)
  const proximo = proximoMarco(p)
  const categoria = CATEGORIAS.find((c) => c.value === p.categoria)?.label
  return (
    <li>
      <Link to="/projetos" className="group block h-full rounded-[24px] bg-white p-4 shadow-[0_2px_8px_-4px_rgba(27,24,19,0.12)] ring-1 ring-grafite-200 transition-all hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(27,24,19,0.45)]">
        <span className="flex items-center gap-2 text-xs text-grafite-500">
          <span className="grid h-6 w-6 place-items-center rounded-lg text-white" style={{ background: rgb(CATEGORIA_RGB[p.categoria]) }}>
            <IconeCategoria categoria={p.categoria} size={13} />
          </span>
          {categoria}
        </span>
        <span className="mt-2 block font-heading text-base font-extrabold leading-tight text-grafite-900">{p.nome}</span>
        <span className="mt-2 flex gap-1" aria-label={`Etapa: ${STATUS_LABELS[p.status]}`}>
          {ETAPAS_PUBLICAS.map((e, i) => (
            <span key={e.status} className={`h-1.5 flex-1 rounded-full ${i <= etapa ? 'bg-amarelo-500' : 'bg-grafite-200'}`} />
          ))}
        </span>
        <span className="mt-2 block text-xs font-semibold text-grafite-700">{STATUS_LABELS[p.status]}</span>
        {proximo && (
          <span className="mt-1 block text-xs text-grafite-500">
            Próximo: <b className="text-grafite-900">{proximo.nome}</b>, {dataLocal(proximo.data_prevista).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </Link>
    </li>
  )
}
