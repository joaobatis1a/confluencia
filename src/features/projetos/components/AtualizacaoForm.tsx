import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PROXIMOS_STATUS, publicarAtualizacao, type NovaAtualizacao } from '../api'
import { dataLocal } from '../etapas'
import { hojeIso, situacaoDoMarco } from '../timeline'
import { useAuth } from '../../../context/AuthContext'
import { enviarFoto } from '../../../lib/fotos'
import CampoFoto from '../../../components/CampoFoto'
import { STATUS_LABELS, type Projeto, type ProjetoStatus } from '../../../types/database'

// Publicar atualização, em quatro perguntas: o que aconteceu? (tipo) → detalhes
// → o que a população vai ver (texto e foto) → conferir a prévia e publicar.
// As regras valem de verdade no servidor (função publicar_atualizacao, 0016):
// aqui a tela só deixa claro o que cada escolha causa e impede o erro antes.

type Tipo = 'marco' | 'etapa' | 'prazo' | 'aviso'

const EFEITO: Partial<Record<ProjetoStatus, string>> = {
  em_consulta: 'Abre a votação da população até a data que você escolher.',
  aprovado: 'Encerra a consulta e o projeto segue para a execução.',
  rejeitado: 'Encerra a consulta e tira o projeto da visão pública. Não dá para desfazer.',
  em_execucao: 'A obra começou: a população acompanha a execução.',
  concluido: 'Entregue: o projeto vira um caso concluído.',
}

const TIPOS: { id: Tipo; titulo: string; texto: string; icone: string }[] = [
  { id: 'marco', titulo: 'Concluí um marco', texto: 'Algo da linha do tempo foi feito', icone: 'M5 12.5 9.5 17 19 7.5' },
  { id: 'etapa', titulo: 'Mudar de etapa', texto: 'Abrir consulta, aprovar, iniciar a obra…', icone: 'M5 12h14m-5-5 5 5-5 5' },
  { id: 'prazo', titulo: 'Prorrogar a consulta', texto: 'Dar mais dias para votar', icone: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z' },
  { id: 'aviso', titulo: 'Só um aviso', texto: 'Contar o que está acontecendo', icone: 'M4 5h16v11H9l-5 4V5Z' },
]

interface Props {
  projeto: Projeto
  onPublicada: (atualizado: Projeto) => void
  onCancelar: () => void
}

export default function AtualizacaoForm({ projeto, onPublicada, onCancelar }: Props) {
  const { user } = useAuth()
  const [hoje] = useState(hojeIso)
  const marcosAbertos = projeto.timeline.map((marco, indice) => ({ marco, indice })).filter(({ marco }) => !marco.data_real)
  const proximos = PROXIMOS_STATUS[projeto.status]
  const emConsulta = projeto.status === 'em_consulta'
  const disponivel: Record<Tipo, string | null> = {
    marco: marcosAbertos.length === 0 ? 'Todos os marcos já foram concluídos' : null,
    etapa: proximos.length === 0 ? 'Este projeto já está na última etapa' : null,
    prazo: emConsulta ? null : 'Só para projetos em consulta',
    aviso: null,
  }

  const [tipo, setTipo] = useState<Tipo | null>(null)
  const [marcoIndice, setMarcoIndice] = useState<number | null>(null)
  const [dataReal, setDataReal] = useState(hoje)
  const [novoStatus, setNovoStatus] = useState<ProjetoStatus | null>(null)
  const [consultaFim, setConsultaFim] = useState('')
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPrevia, setFotoPrevia] = useState<string | null>(null)
  const [ciente, setCiente] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const rejeitando = tipo === 'etapa' && novoStatus === 'rejeitado'
  const pedeData = tipo === 'prazo' || (tipo === 'etapa' && novoStatus === 'em_consulta')

  function validar(): string | null {
    if (!tipo) return 'Escolha o que aconteceu.'
    if (tipo === 'marco') {
      if (marcoIndice === null) return 'Escolha qual marco foi concluído.'
      if (!dataReal) return 'Informe a data em que foi concluído.'
      if (dataReal > hoje) return 'A data de conclusão não pode ser no futuro.'
    }
    if (tipo === 'etapa' && !novoStatus) return 'Escolha a nova etapa.'
    if (pedeData && !consultaFim) return 'Informe até quando a consulta fica aberta.'
    if (pedeData && consultaFim <= hoje) return 'A data precisa ser depois de hoje.'
    if (tipo === 'prazo' && projeto.consulta_fim && consultaFim <= projeto.consulta_fim.slice(0, 10)) return 'O novo prazo precisa ser depois do atual.'
    if (tipo === 'aviso' && texto.trim().length < 10) return 'Escreva o aviso (pelo menos 10 caracteres).'
    if (rejeitando && !ciente) return 'Confirme que entende que a rejeição não pode ser desfeita.'
    return null
  }

  async function publicar(e: FormEvent) {
    e.preventDefault()
    const problema = validar()
    if (problema) return setErro(problema)
    setErro(null)
    setSalvando(true)
    try {
      const a: NovaAtualizacao = { texto: texto.trim() || undefined }
      if (tipo === 'marco') {
        a.marco = marcoIndice!
        a.dataReal = dataReal
      }
      if (tipo === 'etapa') a.novoStatus = novoStatus!
      if (pedeData) a.consultaFim = new Date(`${consultaFim}T23:59:59`).toISOString()
      if (foto && user) a.fotoUrl = await enviarFoto(foto, 'relato', user.id)
      onPublicada(await publicarAtualizacao(projeto, a))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível publicar.')
    } finally {
      setSalvando(false)
    }
  }

  const resumo = [
    tipo === 'marco' && marcoIndice !== null && `Marco concluído: ${projeto.timeline[marcoIndice].nome}`,
    tipo === 'etapa' && novoStatus && `${STATUS_LABELS[projeto.status]} → ${STATUS_LABELS[novoStatus]}`,
    pedeData && consultaFim && `Consulta aberta até ${new Date(`${consultaFim}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`,
    tipo === 'aviso' && 'Aviso do órgão',
  ].filter(Boolean) as string[]

  return (
    <form onSubmit={publicar} className="space-y-6" noValidate>
      <div>
        <h3 className="font-heading text-xl font-extrabold text-grafite-900">Publicar atualização</h3>
        <p className="text-sm text-grafite-500">A população e quem acompanha o projeto veem o que você publicar aqui.</p>
      </div>

      {/* 1. O que aconteceu */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-grafite-500">1. O que aconteceu?</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de atualização">
          {TIPOS.map((t) => {
            const motivo = disponivel[t.id]
            const ativo = tipo === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                disabled={Boolean(motivo)}
                onClick={() => {
                  setTipo(t.id)
                  setErro(null)
                  if (t.id !== 'marco') setMarcoIndice(null)
                  if (t.id !== 'etapa') setNovoStatus(null)
                }}
                className={`rounded-2xl border-2 p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                  ativo ? 'border-grafite-900 bg-white shadow-md' : 'border-grafite-200 bg-white hover:-translate-y-0.5 hover:border-grafite-300 disabled:hover:translate-y-0'
                }`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-xl ${ativo ? 'bg-amarelo-500 text-grafite-900' : 'bg-grafite-100 text-grafite-700'}`}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={t.icone} />
                  </svg>
                </span>
                <span className="mt-2 block text-sm font-bold leading-tight text-grafite-900">{t.titulo}</span>
                <span className="block text-xs text-grafite-500">{motivo ?? t.texto}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* 2. Detalhes */}
      <AnimatePresence mode="wait" initial={false}>
        {tipo && tipo !== 'aviso' && (
          <motion.fieldset key={tipo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-grafite-500">2. Detalhes</legend>

            {tipo === 'marco' && (
              <>
                <div role="radiogroup" aria-label="Marco concluído" className="space-y-2">
                  {marcosAbertos.map(({ marco, indice }) => {
                    const atrasado = situacaoDoMarco(marco, hoje).situacao === 'atrasado'
                    return (
                      <button key={indice} type="button" role="radio" aria-checked={marcoIndice === indice} onClick={() => setMarcoIndice(indice)} className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${marcoIndice === indice ? 'border-status-verde-500 bg-status-verde-50' : 'border-grafite-200 bg-white hover:border-grafite-300'}`}>
                        <span className="text-sm font-semibold text-grafite-900">{marco.nome}</span>
                        <span className={`text-xs ${atrasado ? 'font-bold text-status-vermelho-700' : 'text-grafite-500'}`}>
                          {atrasado ? 'atrasado · ' : 'previsto '}
                          {dataLocal(marco.data_prevista).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {marcoIndice !== null && (
                  <label className="mt-3 block text-sm font-semibold text-grafite-900">
                    Concluído em
                    <input type="date" value={dataReal} max={hoje} onChange={(e) => setDataReal(e.target.value)} className="mt-1.5 block rounded-2xl border border-grafite-300 bg-white px-4 py-2.5 text-sm font-normal focus:border-amarelo-500 focus:outline-none focus:ring-4 focus:ring-amarelo-500/20" />
                  </label>
                )}
              </>
            )}

            {tipo === 'etapa' && (
              <div role="radiogroup" aria-label="Nova etapa" className="space-y-2">
                {proximos.map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={novoStatus === s} onClick={() => { setNovoStatus(s); setCiente(false) }} className={`block w-full rounded-2xl border-2 px-4 py-3 text-left transition-colors ${novoStatus === s ? (s === 'rejeitado' ? 'border-status-vermelho-500 bg-status-vermelho-50' : 'border-grafite-900 bg-amarelo-50') : 'border-grafite-200 bg-white hover:border-grafite-300'}`}>
                    <span className="text-sm font-bold text-grafite-900">{s === 'aprovado' || s === 'rejeitado' ? `Encerrar consulta: ${STATUS_LABELS[s]}` : STATUS_LABELS[s]}</span>
                    <span className="block text-xs text-grafite-700">{EFEITO[s]}</span>
                  </button>
                ))}
              </div>
            )}

            {pedeData && (
              <label className="mt-3 block text-sm font-semibold text-grafite-900">
                {tipo === 'prazo' ? 'Novo fim da consulta' : 'Fim da consulta pública'}
                <input type="date" value={consultaFim} min={hoje} onChange={(e) => setConsultaFim(e.target.value)} className="mt-1.5 block rounded-2xl border border-grafite-300 bg-white px-4 py-2.5 text-sm font-normal focus:border-amarelo-500 focus:outline-none focus:ring-4 focus:ring-amarelo-500/20" />
                {tipo === 'prazo' && projeto.consulta_fim && <span className="mt-1 block text-xs font-normal text-grafite-500">Hoje termina em {dataLocal(projeto.consulta_fim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}.</span>}
              </label>
            )}

            {rejeitando && (
              <label className="mt-3 flex items-start gap-3 rounded-2xl bg-status-vermelho-50 p-4 text-sm text-status-vermelho-700">
                <input type="checkbox" checked={ciente} onChange={(e) => setCiente(e.target.checked)} className="mt-0.5 h-4 w-4 accent-status-vermelho-500" />
                <span>Entendo que o projeto deixa de aparecer ao público e que isso não pode ser desfeito.</span>
              </label>
            )}
          </motion.fieldset>
        )}
      </AnimatePresence>

      {/* 3. O que a população vai ver */}
      {tipo && (
        <motion.fieldset initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-grafite-500">{tipo === 'aviso' ? '2' : '3'}. O que a população vai ver</legend>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            maxLength={500}
            aria-label="Texto da atualização"
            placeholder={tipo === 'aviso' ? 'Conte o que está acontecendo, em linguagem simples.' : 'Opcional: explique o que mudou e o que vem agora.'}
            className="w-full resize-none rounded-2xl border border-grafite-300 bg-white px-4 py-3 text-sm text-grafite-900 focus:border-amarelo-500 focus:outline-none focus:ring-4 focus:ring-amarelo-500/20"
          />
          <p className="mb-3 text-right text-xs text-grafite-500">{texto.length}/500</p>
          <CampoFoto
            previa={fotoPrevia}
            rotulo="Foto do andamento"
            dica="Opcional. Uma foto da obra ou do local ajuda a população a acreditar no que você conta."
            onEscolher={(arquivo) => {
              setFoto(arquivo)
              setFotoPrevia((antiga) => {
                if (antiga) URL.revokeObjectURL(antiga)
                return arquivo ? URL.createObjectURL(arquivo) : null
              })
            }}
          />
        </motion.fieldset>
      )}

      {/* 4. Prévia */}
      {tipo && (resumo.length > 0 || texto.trim() || fotoPrevia) && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-label="Prévia" className="rounded-2xl bg-grafite-50 p-4 ring-1 ring-grafite-200">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-grafite-500">Prévia: assim aparece no projeto</p>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-grafite-200">
            <p className="text-xs">
              <b className="text-grafite-900">Órgão responsável</b> <span className="text-grafite-500">agora</span>
            </p>
            {resumo.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resumo.map((r) => (
                  <span key={r} className="rounded-full bg-status-azul-50 px-2.5 py-1 text-[11px] font-bold text-status-azul-700">
                    {r}
                  </span>
                ))}
              </div>
            )}
            {texto.trim() && <p className="mt-2 whitespace-pre-line text-sm text-grafite-900">{texto.trim()}</p>}
            {fotoPrevia && <img src={fotoPrevia} alt="" className="mt-3 max-h-48 w-full rounded-xl object-cover" />}
          </div>
        </motion.section>
      )}

      {erro && (
        <p role="alert" className="rounded-2xl bg-status-vermelho-50 px-4 py-3 text-sm text-status-vermelho-700">
          {erro}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={salvando || !tipo} className="rounded-full bg-grafite-900 px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:bg-grafite-200 disabled:text-grafite-500 disabled:hover:translate-y-0">
          {salvando ? 'Publicando…' : 'Publicar atualização'}
        </button>
        <button type="button" onClick={onCancelar} disabled={salvando} className="rounded-full px-6 py-3 text-sm font-bold text-grafite-700 ring-1 ring-grafite-300 hover:bg-grafite-50">
          Cancelar
        </button>
      </div>
    </form>
  )
}
