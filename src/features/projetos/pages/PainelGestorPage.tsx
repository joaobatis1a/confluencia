import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../../context/AuthContext'
import { CATEGORIA_RGB, rgb } from '../../feed/cores'
import IconeCategoria from '../../feed/components/IconeCategoria'
import { nivelRepercussao } from '../../../lib/repercussao'
import type { Categoria } from '../../../types/database'
import { diasRestantes } from '../etapas'
import { diasDesde, faseDoRelato, marcosAtrasados, useProjetosGestor, useRelatosGestor } from '../../gestor/dados'
import { CountUp, Painel, RoscaCategorias, Sparkline } from '../../gestor/graficos'
import CentralShell, { Numero } from '../../gestor/CentralShell'

// Painel do órgão (v3): a visão geral. O que pede ação hoje, os números do
// órgão e atalhos para a Central de relatos e o Quadro de projetos, onde o
// trabalho acontece. Protegido por RequireInstitutional em App.tsx + RLS no banco.

interface Alerta {
  chave: string
  tipo: 'urgente' | 'prazo' | 'atraso'
  titulo: string
  detalhe: string
  to: string
  categoria?: Categoria
}

const ROTULO = { urgente: 'Relato sem resposta', prazo: 'Consulta acabando', atraso: 'Marco atrasado' }
const COR = { urgente: '#d63b2f', prazo: '#2e5fcf', atraso: '#f5b800' }

export default function PainelGestorPage() {
  const { profile } = useAuth()
  const relatos = useRelatosGestor()
  const { projetos, resultados, erro } = useProjetosGestor()
  const [agora] = useState(() => Date.now())
  const nome = profile?.orgao_nome ?? 'seu órgão'

  const dados = useMemo(() => {
    const rel = relatos ?? []
    const proj = projetos ?? []
    const pend = rel.filter((r) => faseDoRelato(r) === 'pendente')
    const votos = Object.values(resultados).reduce((s, r) => s + r.total_votos, 0)
    const alertas: Alerta[] = []
    pend
      .filter((r) => nivelRepercussao(r.repercussao) !== 'baixa' || diasDesde(r.created_at) > 14)
      .sort((a, b) => b.repercussao - a.repercussao || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 3)
      .forEach((r) =>
        alertas.push({ chave: r.id, tipo: 'urgente', titulo: `${r.bairro}: ${r.descricao.slice(0, 70)}`, detalhe: `${r.repercussao} de repercussão · ${diasDesde(r.created_at)} dias sem resposta`, to: `/feed/${r.id}`, categoria: r.categoria }),
      )
    proj.forEach((p) => {
      const dias = diasRestantes(p, agora)
      if (p.status === 'em_consulta' && dias !== null && dias <= 7)
        alertas.push({ chave: `c${p.id}`, tipo: 'prazo', titulo: p.nome, detalhe: dias === 0 ? 'A consulta termina hoje' : `A consulta termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}`, to: '/projetos', categoria: p.categoria })
      const atr = marcosAtrasados(p)
      if (atr > 0) alertas.push({ chave: `a${p.id}`, tipo: 'atraso', titulo: p.nome, detalhe: `${atr} ${atr === 1 ? 'marco atrasado' : 'marcos atrasados'}`, to: '/projetos', categoria: p.categoria })
    })
    return {
      rel,
      pend: pend.length,
      consultas: proj.filter((p) => p.status === 'em_consulta').length,
      execucao: proj.filter((p) => p.status === 'em_execucao').length,
      votos,
      alertas,
    }
  }, [relatos, projetos, resultados, agora])

  return (
    <CentralShell
      kicker="Painel do órgão"
      titulo="Bom dia"
      sub={`O que precisa de ${nome} hoje e como a cidade está respondendo ao que o órgão faz.`}
      acoes={
        <Link to="/projetos/novo" className="inline-flex items-center gap-2 rounded-full bg-amarelo-500 px-6 py-3 text-sm font-bold text-grafite-900 transition-transform hover:-translate-y-0.5">
          <span className="text-lg leading-none">+</span> Novo projeto
        </Link>
      }
    >
      {erro && <p className="mt-8 rounded-2xl bg-status-vermelho-500/15 p-4 text-sm text-status-vermelho-500">Não foi possível carregar os projetos: {erro}</p>}

      <div className="mt-10 grid grid-cols-2 border-t-2 border-amarelo-500 lg:grid-cols-4">
        <Numero valor={<CountUp valor={dados.pend} />} rotulo="relatos sem resposta" frase="na Central de relatos" alerta={dados.pend > 0} />
        <Numero valor={<CountUp valor={dados.consultas} />} rotulo="em consulta" frase="a população está votando" />
        <Numero valor={<CountUp valor={dados.votos} />} rotulo={dados.votos === 1 ? 'voto' : 'votos'} frase="nas suas consultas" />
        <Numero valor={<CountUp valor={dados.execucao} />} rotulo="em execução" frase="obras andando" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="precisa">
            <h2 id="precisa" className="font-heading text-2xl font-extrabold">
              Precisa de você
            </h2>
            {relatos === null || projetos === null ? (
              <ul className="mt-4 space-y-3" aria-busy>
                {[0, 1, 2].map((i) => (
                  <li key={i} className="h-20 animate-pulse rounded-[22px] bg-white/[0.05]" />
                ))}
              </ul>
            ) : dados.alertas.length === 0 ? (
              <p className="mt-4 rounded-[22px] bg-status-verde-500/10 p-6 text-status-verde-500">Tudo em dia. Nenhum relato urgente, prazo ou marco atrasado agora.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {dados.alertas.map((a, i) => (
                  <motion.li key={a.chave} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                    <Link to={a.to} className="group relative flex items-center gap-4 overflow-hidden rounded-[22px] bg-white/[0.05] p-4 pl-5 ring-1 ring-white/10 transition-colors hover:bg-white/[0.09]">
                      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: COR[a.tipo] }} />
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: a.categoria ? rgb(CATEGORIA_RGB[a.categoria]) : COR[a.tipo] }}>
                        <IconeCategoria categoria={a.categoria ?? 'outros'} size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: COR[a.tipo] }}>
                          {ROTULO[a.tipo]}
                        </span>
                        <span className="mt-0.5 block truncate font-semibold">{a.titulo}</span>
                        <span className="block text-sm text-white/55">{a.detalhe}</span>
                      </span>
                      <span className="text-xl text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-amarelo-500">→</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Atalhos" className="grid gap-4 sm:grid-cols-2">
            <Atalho to="/feed" titulo="Central de relatos" texto="Responda os relatos da cidade e vire projeto." numero={dados.pend} rotulo="sem resposta" />
            <Atalho to="/projetos" titulo="Quadro de projetos" texto="Atualize etapas e acompanhe as consultas." numero={projetos?.length ?? 0} rotulo="projetos" />
          </section>
        </div>

        <aside className="space-y-5" aria-label="Leitura da cidade">
          <Painel titulo="Ritmo da cidade">
            <Sparkline relatos={dados.rel} />
          </Painel>
          <Painel titulo="O que a cidade relata">
            <RoscaCategorias relatos={dados.rel} />
          </Painel>
        </aside>
      </div>
    </CentralShell>
  )
}

function Atalho({ to, titulo, texto, numero, rotulo }: { to: string; titulo: string; texto: string; numero: number; rotulo: string }) {
  return (
    <Link to={to} className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-amarelo-500 to-amarelo-300 p-6 text-grafite-900 transition-transform hover:-translate-y-1">
      <span aria-hidden className="absolute -right-6 -top-10 font-heading text-[9rem] font-extrabold leading-none text-black/10">
        {numero}
      </span>
      <span className="relative block text-xs font-bold uppercase tracking-[0.12em] text-grafite-900/60">
        {numero} {rotulo}
      </span>
      <span className="relative mt-3 block font-heading text-2xl font-extrabold leading-tight">{titulo}</span>
      <span className="relative mt-1 block text-sm text-grafite-900/75">{texto}</span>
      <span className="relative mt-4 inline-block text-sm font-bold transition-transform group-hover:translate-x-1">Abrir →</span>
    </Link>
  )
}
