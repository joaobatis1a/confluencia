import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { listarAtualizacoes, type AtualizacaoHistorico } from '../api'
import { dataLocal } from '../etapas'
import { formatRelativo } from '../../../lib/repercussao'
import { STATUS_LABELS } from '../../../types/database'

// O que o órgão já publicou sobre o projeto: marcos concluídos, mudanças de
// etapa e avisos, com texto e foto. Aparece na página pública e no Quadro.
export default function HistoricoAtualizacoes({ projetoId, versao = 0, vazio = true }: { projetoId: string; versao?: number; vazio?: boolean }) {
  const [lista, setLista] = useState<AtualizacaoHistorico[] | null>(null)

  useEffect(() => {
    let cancelado = false
    listarAtualizacoes(projetoId).then((l) => !cancelado && setLista(l))
    return () => {
      cancelado = true
    }
  }, [projetoId, versao])

  if (lista === null) return <div className="h-16 animate-pulse rounded-2xl bg-grafite-100" />
  if (lista.length === 0) {
    return vazio ? <p className="rounded-2xl border-2 border-dashed border-grafite-200 p-4 text-sm text-grafite-500">O órgão ainda não publicou atualizações neste projeto.</p> : null
  }
  return (
    <ol className="relative space-y-4 border-l-2 border-dashed border-grafite-300 pl-5">
      {lista.map((a, i) => (
        <motion.li key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.05 }} className="relative">
          <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-status-azul-500" />
          <div className="rounded-2xl bg-white p-4 ring-1 ring-grafite-200">
            <p className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-grafite-900">Órgão responsável</span>
              <span className="text-grafite-500">{formatRelativo(a.created_at)}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {a.marco_nome && (
                <span className="rounded-full bg-status-verde-50 px-2.5 py-1 text-[11px] font-bold text-status-verde-700">
                  Marco concluído: {a.marco_nome}
                  {a.marco_data && ` · ${dataLocal(a.marco_data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
                </span>
              )}
              {a.status_para && (
                <span className="rounded-full bg-status-azul-50 px-2.5 py-1 text-[11px] font-bold text-status-azul-700">
                  {a.status_de ? `${STATUS_LABELS[a.status_de]} → ` : ''}
                  {STATUS_LABELS[a.status_para]}
                </span>
              )}
              {!a.marco_nome && !a.status_para && <span className="rounded-full bg-amarelo-100 px-2.5 py-1 text-[11px] font-bold text-amarelo-900">Aviso</span>}
            </div>
            {a.texto && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-grafite-900">{a.texto}</p>}
            {a.foto_url && (
              <a href={a.foto_url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-2xl">
                <img src={a.foto_url} alt="Foto da atualização" loading="lazy" className="max-h-72 w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
              </a>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  )
}
