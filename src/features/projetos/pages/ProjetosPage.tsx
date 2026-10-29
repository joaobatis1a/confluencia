import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { listarProjetosPublicos } from '../api'
import ProjetoCard from '../components/ProjetoCard'
import Pills from '../../../components/Pills'
import { STATUS_LABELS, type Projeto, type ProjetoStatus } from '../../../types/database'

// Filtros da listagem pública: projeto rejeitado não é público (só aparece no
// painel do órgão dono), então não existe pill "Rejeitado" aqui.
const STATUS_PUBLICOS = (Object.keys(STATUS_LABELS) as ProjetoStatus[]).filter((s) => s !== 'rejeitado')

// Tarefa 2.4 (filtro por status) + 3.x da Ana: a listagem agora lê de verdade da
// tabela `projetos` (ver ../api.ts); sem Supabase configurado usa os dados mock.
export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [status, setStatus] = useState<ProjetoStatus | 'todos'>('todos')

  useEffect(() => {
    let cancelled = false
    listarProjetosPublicos()
      .then((data) => {
        if (!cancelled) setProjetos(data)
      })
      .catch((err) => {
        if (!cancelled) setErro(err instanceof Error ? err.message : 'erro desconhecido')
      })
      .finally(() => {
        if (!cancelled) setCarregando(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(
    () => projetos.filter((p) => status === 'todos' || p.status === status),
    [projetos, status],
  )

  const pillOptions = [
    { value: 'todos' as const, label: 'Todos' },
    ...STATUS_PUBLICOS.map((value) => ({ value, label: STATUS_LABELS[value] })),
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-grafite-900">Projetos</h1>
        <p className="text-sm text-grafite-500">Acompanhe e vote nos projetos da sua cidade.</p>
      </div>

      {erro ? (
        <div className="rounded-[var(--radius-field)] bg-status-vermelho-50 text-status-vermelho-700 text-sm p-4">
          Não foi possível carregar os projetos: {erro}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Pills options={pillOptions} value={status} onChange={setStatus} layoutId="projetos-status-pill" />
          </div>

          {carregando ? (
            <p className="text-sm text-grafite-500">Carregando projetos...</p>
          ) : (
            <>
              <p className="text-xs text-grafite-500 mb-3">
                {filtered.length} {filtered.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}
              </p>

              {filtered.length === 0 ? (
                <p className="text-sm text-grafite-500">
                  {projetos.length === 0 ? 'Nenhum projeto publicado ainda.' : 'Nenhum projeto com esse status.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((projeto) => (
                      <ProjetoCard key={projeto.id} projeto={projeto} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
