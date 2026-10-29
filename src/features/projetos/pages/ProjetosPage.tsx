import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { MOCK_PROJETOS } from '../mock'
import { isSupabaseConfigured } from '../../../lib/supabase'
import { buscarResultados } from '../api'
import { carregarProjetosPublicos, ehExemplo } from '../vitrine'
import TrilhoEtapas from '../components/TrilhoEtapas'
import ConsultaDestaque from '../components/ConsultaDestaque'
import ProjetoCartao from '../components/ProjetoCartao'
import { ETAPAS_PUBLICAS } from '../etapas'
import type { Projeto, ProjetoStatus, VotosResultado } from '../../../types/database'

gsap.registerPlugin(useGSAP, SplitText)

// Tarefa 2.4 da Ana: listagem com filtro por status. Os dados vêm de ../api.ts
// (banco real, ou mock sem Supabase) somados aos projetos de exemplo da vitrine.
const SO_EXEMPLOS = MOCK_PROJETOS.filter((p) => p.status !== 'rejeitado')

export default function ProjetosPage() {
  const raiz = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<ProjetoStatus | 'todos'>('todos')
  const [agora] = useState(() => Date.now())
  const [resultados, setResultados] = useState<Record<string, VotosResultado>>({})
  // Começa com os exemplos (aparecem na hora); os do banco entram quando chegam.
  const [projetos, setProjetos] = useState<Projeto[]>(SO_EXEMPLOS)

  useEffect(() => {
    let cancelado = false
    carregarProjetosPublicos()
      .then((lista) => {
        if (!cancelado) setProjetos(lista)
      })
      .catch(() => {
        // Banco fora do ar: a tela segue com os exemplos.
      })
    return () => {
      cancelado = true
    }
  }, [])

  // Rejeitados não aparecem para a população — só no painel do órgão.
  const publicos = useMemo(() => projetos.filter((p) => p.status !== 'rejeitado'), [projetos])
  const emConsulta = useMemo(() => publicos.filter((p) => p.status === 'em_consulta'), [publicos])

  const contagem = useMemo(() => {
    const c = Object.fromEntries(ETAPAS_PUBLICAS.map((e) => [e.status, 0])) as Record<ProjetoStatus, number>
    for (const p of publicos) c[p.status] = (c[p.status] ?? 0) + 1
    return c
  }, [publicos])

  const filtrados = useMemo(
    () =>
      publicos.filter(
        (p) => status === 'todos' || p.status === status,
      ),
    [publicos, status],
  )
  const destaques =
    status === 'todos' || status === 'em_consulta'
      ? emConsulta
      : []
  const grade = filtrados.filter((p) => !destaques.includes(p))

  // Resultado agregado das consultas abertas. Com o banco ligado, só os ids reais:
  // os projetos de exemplo da vitrine não estão nele.
  useEffect(() => {
    const ids = emConsulta.map((p) => p.id).filter((id) => !isSupabaseConfigured || !ehExemplo(id))
    if (ids.length === 0) return
    let cancelado = false
    buscarResultados(ids)
      .then((r) => {
        if (!cancelado) setResultados(r)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [emConsulta])

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const titulo = SplitText.create('[data-anim="titulo"]', { type: 'chars' })
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .from(titulo.chars, { yPercent: 110, opacity: 0, stagger: 0.05, duration: 0.8 })
        .from('[data-anim="sub"]', { y: 12, opacity: 0, duration: 0.6 }, '-=0.5')
      return () => titulo.revert()
    },
    { scope: raiz },
  )

  return (
    <div ref={raiz} className="mx-auto max-w-7xl px-5 sm:px-8 py-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p data-anim="sub" className="text-xs font-bold uppercase tracking-[0.14em] text-amarelo-700">
            Recife · obras e programas públicos
          </p>
          <h1
            data-anim="titulo"
            className="mt-2 overflow-hidden font-heading text-5xl sm:text-6xl font-extrabold leading-none text-grafite-900"
          >
            Projetos
          </h1>
        </div>
        <p data-anim="sub" className="max-w-md text-[15px] text-grafite-700">
          Acompanhe o caminho de cada projeto, da proposta à entrega. Nos que estão em consulta pública, seu voto
          conta.
        </p>
      </header>

      <div className="mt-10">
        <TrilhoEtapas contagem={contagem} total={publicos.length} value={status} onChange={setStatus} />
      </div>

      <AnimatePresence mode="popLayout">
        {destaques.length > 0 && (
          <motion.section
            key="destaques"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-10 space-y-5"
          >
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-grafite-500">Em consulta agora</h2>
            {destaques.map((p, i) => (
              <ConsultaDestaque key={p.id} projeto={p} resultado={resultados[p.id]} agora={agora} indice={i} />
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      <section className="mt-12">
        {grade.length > 0 && (
          <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.14em] text-grafite-500">
            {status === 'todos' ? 'Outros projetos' : `${grade.length} ${grade.length === 1 ? 'projeto' : 'projetos'} nesta etapa`}
          </h2>
        )}
        {filtrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border-2 border-dashed border-grafite-200 px-6 py-14 text-center"
          >
            <p className="font-heading text-xl font-bold text-grafite-900">
              Nenhum projeto nesta etapa agora
            </p>
            <p className="mt-1 text-sm text-grafite-500">
              Escolha outra etapa no trilho ou volte para "Todos".
            </p>
          </motion.div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {grade.map((p, i) => (
                <ProjetoCartao key={p.id} projeto={p} agora={agora} indice={i} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  )
}
