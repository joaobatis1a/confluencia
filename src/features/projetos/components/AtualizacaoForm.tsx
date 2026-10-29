import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { atualizarProjeto, PROXIMOS_STATUS, type AtualizacaoProjeto } from '../api'
import { hojeIso } from '../timeline'
import { Button, FormError, Label, Select, TextField } from '../../../components/ui'
import { STATUS_LABELS, type Projeto, type ProjetoStatus } from '../../../types/database'

// Tarefa 3.2 da Ana, passo 2: ação "publicar atualização". Uma atualização é
// (a) marcar um marco da timeline como concluído e/ou (b) mudar o status do
// projeto (ex.: encerrar a consulta aprovando/rejeitando, iniciar a execução).
// Pelo menos uma das duas é obrigatória.
interface Props {
  projeto: Projeto
  onPublicada: (atualizado: Projeto) => void
  onCancelar: () => void
}

export default function AtualizacaoForm({ projeto, onPublicada, onCancelar }: Props) {
  const marcosAbertos = projeto.timeline
    .map((marco, indice) => ({ marco, indice }))
    .filter(({ marco }) => !marco.data_real)
  const proximos = PROXIMOS_STATUS[projeto.status]

  const [marcoIndice, setMarcoIndice] = useState('')
  const [dataReal, setDataReal] = useState(hojeIso)
  const [novoStatus, setNovoStatus] = useState<ProjetoStatus | ''>('')
  const [consultaFim, setConsultaFim] = useState('')
  const [hoje] = useState(hojeIso)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function publicar(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (marcoIndice === '' && novoStatus === '') {
      setErro('Escolha um marco para concluir e/ou um novo status.')
      return
    }
    if (marcoIndice !== '' && !dataReal) {
      setErro('Informe a data em que o marco foi concluído.')
      return
    }
    if (novoStatus === 'em_consulta' && !consultaFim) {
      setErro('Informe até quando a consulta pública fica aberta.')
      return
    }

    const mudancas: AtualizacaoProjeto = {}
    if (marcoIndice !== '') {
      const alvo = Number(marcoIndice)
      mudancas.timeline = projeto.timeline.map((m, i) => (i === alvo ? { ...m, data_real: dataReal } : m))
    }
    if (novoStatus !== '') {
      mudancas.status = novoStatus
      if (novoStatus === 'em_consulta') {
        mudancas.consulta_fim = new Date(`${consultaFim}T23:59:59`).toISOString()
      }
    }

    setSalvando(true)
    try {
      onPublicada(await atualizarProjeto(projeto.id, mudancas))
    } catch (err) {
      setErro(`Não foi possível publicar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <motion.form
      onSubmit={publicar}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-4 pt-4 border-t border-grafite-200 space-y-4">
        <p className="text-sm font-semibold text-grafite-900">Publicar atualização</p>

        {marcosAbertos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Marco concluído (opcional)</Label>
              <Select value={marcoIndice} onChange={(e) => setMarcoIndice(e.target.value)}>
                <option value="">Nenhum</option>
                {marcosAbertos.map(({ marco, indice }) => (
                  <option key={indice} value={indice}>
                    {marco.nome}
                  </option>
                ))}
              </Select>
            </div>
            {marcoIndice !== '' && (
              <div>
                <Label>Data de conclusão</Label>
                <TextField type="date" value={dataReal} max={hoje} onChange={(e) => setDataReal(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {proximos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Novo status (opcional)</Label>
              <Select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value as ProjetoStatus | '')}>
                <option value="">Manter {STATUS_LABELS[projeto.status].toLowerCase()}</option>
                {proximos.map((s) => (
                  <option key={s} value={s}>
                    {s === 'aprovado' || s === 'rejeitado' ? `Encerrar consulta: ${STATUS_LABELS[s]}` : STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            {novoStatus === 'em_consulta' && (
              <div>
                <Label>Fim da consulta pública</Label>
                <TextField type="date" value={consultaFim} min={hoje} onChange={(e) => setConsultaFim(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {novoStatus === 'rejeitado' && (
          <p className="rounded-[var(--radius-field)] bg-status-vermelho-50 text-status-vermelho-700 text-xs p-3">
            Ao marcar como rejeitado, o projeto deixa de aparecer ao público. Só o seu órgão continua vendo
            (neste painel). Não é possível desfazer por aqui.
          </p>
        )}

        {marcosAbertos.length === 0 && proximos.length === 0 && (
          <p className="text-sm text-grafite-500">Este projeto não tem mais atualizações possíveis.</p>
        )}

        {erro && <FormError>{erro}</FormError>}

        <div className="flex gap-3">
          <Button type="submit" disabled={salvando || (marcosAbertos.length === 0 && proximos.length === 0)}>
            {salvando ? 'Publicando...' : 'Publicar'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </Button>
        </div>
      </div>
    </motion.form>
  )
}
