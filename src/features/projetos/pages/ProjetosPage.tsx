import { useMemo, useState } from 'react'
import { MOCK_PROJETOS } from '../mock'
import ProjetoCard from '../components/ProjetoCard'
import { Select } from '../../../components/ui'
import { STATUS_LABELS, type ProjetoStatus } from '../../../types/database'

// Tarefa 2.4 da Ana: "listagem de projetos com dados mock, já com filtro por status".
// --- PRÓXIMO PASSO (pendente de Supabase real) ---
// Troque MOCK_PROJETOS por:
//   const { data } = await supabase.from('projetos').select('*').order('created_at', { ascending: false })
export default function ProjetosPage() {
  const [status, setStatus] = useState<ProjetoStatus | ''>('')

  const filtered = useMemo(
    () => MOCK_PROJETOS.filter((p) => !status || p.status === status),
    [status],
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-grafite-900">Projetos</h1>
        <p className="text-sm text-grafite-500">Acompanhe e vote nos projetos da sua cidade.</p>
      </div>

      <Select
        value={status}
        onChange={(e) => setStatus(e.target.value as ProjetoStatus | '')}
        className="max-w-[260px] mb-6"
      >
        <option value="">Todos os status</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {filtered.length === 0 ? (
        <p className="text-sm text-grafite-500">Nenhum projeto com esse status.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((projeto) => (
            <ProjetoCard key={projeto.id} projeto={projeto} />
          ))}
        </div>
      )}
    </div>
  )
}
