import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MOCK_PROJETOS } from '../mock'
import ProjetoCard from '../components/ProjetoCard'
import Pills from '../../../components/Pills'
import { STATUS_LABELS, type ProjetoStatus } from '../../../types/database'

// Tarefa 2.4 da Ana: "listagem de projetos com dados mock, já com filtro por status".
// --- PRÓXIMO PASSO (pendente de Supabase real) ---
// Troque MOCK_PROJETOS por:
//   const { data } = await supabase.from('projetos').select('*').order('created_at', { ascending: false })
export default function ProjetosPage() {
  const [status, setStatus] = useState<ProjetoStatus | 'todos'>('todos')

  const filtered = useMemo(
    () => MOCK_PROJETOS.filter((p) => status === 'todos' || p.status === status),
    [status],
  )

  const pillOptions = [
    { value: 'todos' as const, label: 'Todos' },
    ...(Object.entries(STATUS_LABELS) as [ProjetoStatus, string][]).map(([value, label]) => ({
      value,
      label,
    })),
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-grafite-900">Projetos</h1>
        <p className="text-sm text-grafite-500">Acompanhe e vote nos projetos da sua cidade.</p>
      </div>

      <div className="mb-6">
        <Pills options={pillOptions} value={status} onChange={setStatus} layoutId="projetos-status-pill" />
      </div>

      <p className="text-xs text-grafite-500 mb-3">
        {filtered.length} {filtered.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-grafite-500">Nenhum projeto com esse status.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((projeto) => (
              <ProjetoCard key={projeto.id} projeto={projeto} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
