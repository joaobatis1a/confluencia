import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  buscarMeuComprovante,
  buscarProjeto,
  buscarResultado,
  votar as registrarVoto,
} from '../api'
import { isSupabaseConfigured } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { hojeIso } from '../timeline'
import { Button, Card } from '../../../components/ui'
import CategoryBadge from '../../../components/CategoryBadge'
import StatusDestaque from '../components/StatusDestaque'
import TimelineProjeto from '../components/TimelineProjeto'
import VotoBar from '../components/VotoBar'
import VerificarComprovante from '../components/VerificarComprovante'
import type { Projeto, VotosResultado } from '../../../types/database'

type Opcao = 'favor' | 'contra'

const caixaAviso = 'rounded-[var(--radius-field)] p-3 text-sm'

// Tarefa 3.1 da Ana: tela de projeto completa — status, timeline (previsto × real,
// com atraso) e área de votação (a favor/contra, comprovante, "já votou", resultado
// agregado). Todas as consultas passam por ../api.ts; o voto em si é a função
// `votar` do banco (0007_votacao_projetos.sql), que valida prazo/status e gera o hash.
export default function ProjetoDetailPage() {
  const { id } = useParams()
  const { user, loading: carregandoConta } = useAuth()
  const [hoje] = useState(hojeIso)
  const [agora] = useState(() => Date.now())

  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [resultado, setResultado] = useState<VotosResultado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const [comprovante, setComprovante] = useState<string | null>(null)
  const [jaVotou, setJaVotou] = useState(false)
  const [votouAgora, setVotouAgora] = useState(false)
  const [escolha, setEscolha] = useState<Opcao | null>(null)
  const [votando, setVotando] = useState(false)
  const [erroVoto, setErroVoto] = useState<string | null>(null)

  const userId = user?.id

  // Projeto + resultado agregado
  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function carregar(projetoId: string) {
      try {
        const p = await buscarProjeto(projetoId)
        const r = p ? await buscarResultado(projetoId) : null
        if (cancelled) return
        setProjeto(p)
        setResultado(r)
      } catch (err) {
        if (!cancelled) setErroCarga(err instanceof Error ? err.message : 'erro desconhecido')
      } finally {
        if (!cancelled) setCarregando(false)
      }
    }
    carregar(id)
    return () => {
      cancelled = true
    }
  }, [id])

  // "Já votou?" — vale também depois de recarregar a página: o banco devolve o
  // comprovante do próprio usuário (nunca a opção votada).
  useEffect(() => {
    if (!id) return
    if (isSupabaseConfigured && !userId) return
    let cancelled = false
    buscarMeuComprovante(id)
      .then((c) => {
        if (cancelled || !c) return
        setComprovante(c)
        setJaVotou(true)
      })
      .catch(() => {
        // sem comprovante conhecido: a tela só não mostra o estado "já votou" de início;
        // se tentar votar de novo, o banco recusa (23505) e o estado aparece na hora.
      })
    return () => {
      cancelled = true
    }
  }, [id, userId])

  if (carregando) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-sm text-grafite-500">Carregando projeto...</div>
  }

  if (erroCarga) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className={`${caixaAviso} bg-status-vermelho-50 text-status-vermelho-700`}>
          Não foi possível carregar o projeto: {erroCarga}
        </div>
        <Link to="/projetos" className="inline-block mt-3 text-amarelo-700 font-semibold text-sm hover:underline">
          Voltar aos Projetos
        </Link>
      </div>
    )
  }

  if (!projeto) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-grafite-500">Projeto não encontrado.</p>
        <Link to="/projetos" className="text-amarelo-700 font-semibold text-sm hover:underline">
          Voltar aos Projetos
        </Link>
      </div>
    )
  }

  const projetoAtual = projeto
  const prazoVencido = projetoAtual.consulta_fim !== null && new Date(projetoAtual.consulta_fim).getTime() < agora
  const consultaAberta = projetoAtual.status === 'em_consulta' && !prazoVencido
  const fimConsulta = projetoAtual.consulta_fim
    ? new Date(projetoAtual.consulta_fim).toLocaleDateString('pt-BR')
    : null

  async function confirmarVoto() {
    if (!escolha) return
    setVotando(true)
    setErroVoto(null)
    const r = await registrarVoto(projetoAtual.id, escolha)
    setVotando(false)

    if (r.ok) {
      setComprovante(r.comprovante)
      setJaVotou(true)
      setVotouAgora(true)
      setEscolha(null)
      // Recarrega o agregado oficial (inclui o voto que acabou de entrar).
      buscarResultado(projetoAtual.id).then(setResultado).catch(() => {})
      return
    }

    setEscolha(null)
    if (r.motivo === 'ja_votou') {
      setJaVotou(true)
      buscarMeuComprovante(projetoAtual.id).then(setComprovante).catch(() => {})
      return
    }
    setErroVoto(r.mensagem)
  }

  function areaDeVoto() {
    if (jaVotou) {
      return (
        <motion.div
          key="ja-votou"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`${caixaAviso} ${
            votouAgora ? 'bg-status-verde-50 text-status-verde-700' : 'bg-grafite-100 text-grafite-700'
          }`}
        >
          {votouAgora
            ? 'Voto registrado! Guarde seu comprovante.'
            : 'Você já votou neste projeto. Como o voto é secreto, não mostramos qual opção você escolheu.'}
          {comprovante && (
            <p className="mt-1.5">
              Comprovante: <code className="text-xs break-all">{comprovante.slice(0, 16)}</code>
            </p>
          )}
        </motion.div>
      )
    }

    // Em modo demonstração (sem Supabase) não existe login, então a votação é liberada.
    if (isSupabaseConfigured && carregandoConta) {
      return <p className="text-sm text-grafite-500">Verificando sua conta...</p>
    }
    if (isSupabaseConfigured && !user) {
      return (
        <div className={`${caixaAviso} bg-grafite-100 text-grafite-700`}>
          Para votar é preciso estar logado.{' '}
          <Link to="/entrar" className="font-semibold text-amarelo-700 hover:underline">
            Entrar
          </Link>{' '}
          ou{' '}
          <Link to="/cadastro" className="font-semibold text-amarelo-700 hover:underline">
            criar conta
          </Link>
          .
        </div>
      )
    }

    if (escolha) {
      return (
        <motion.div key="confirmar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-grafite-900 mb-3">
            Você vai votar <b>{escolha === 'favor' ? 'a favor' : 'contra'}</b>. O voto é secreto e
            <b> não pode ser alterado depois</b>.
          </p>
          <div className="flex gap-3">
            <Button onClick={confirmarVoto} disabled={votando} className="flex-1">
              {votando ? 'Registrando...' : 'Confirmar voto'}
            </Button>
            <Button variant="secondary" onClick={() => setEscolha(null)} disabled={votando} className="flex-1">
              Voltar
            </Button>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div key="botoes" exit={{ opacity: 0, scale: 0.96 }}>
        <div className="flex gap-3">
          <Button onClick={() => setEscolha('favor')} className="flex-1">
            Votar a favor
          </Button>
          <Button variant="secondary" onClick={() => setEscolha('contra')} className="flex-1">
            Votar contra
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/projetos" className="text-sm text-grafite-500 hover:underline">
        ← Voltar aos Projetos
      </Link>

      <div className="mt-4">
        <StatusDestaque projeto={projetoAtual} />
      </div>

      <Card className="mt-4">
        <CategoryBadge categoria={projetoAtual.categoria} />
        <h1 className="font-heading text-xl font-bold text-grafite-900 mt-2 mb-2">{projetoAtual.nome}</h1>
        <p className="text-sm text-grafite-700">{projetoAtual.descricao}</p>
        {projetoAtual.origem_post_id && (
          <Link
            to={`/feed/${projetoAtual.origem_post_id}`}
            className="inline-block mt-3 text-sm font-semibold text-amarelo-700 hover:underline"
          >
            Originado de um relato do Feed →
          </Link>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="font-heading text-sm font-bold text-grafite-900 mb-1">Linha do tempo</h2>
        <TimelineProjeto marcos={projetoAtual.timeline} hoje={hoje} />
      </Card>

      {projetoAtual.status === 'proposto' ? (
        <Card className="mt-4">
          <h2 className="font-heading text-sm font-bold text-grafite-900 mb-1">Consulta pública</h2>
          <p className="text-sm text-grafite-500">
            A consulta ainda não foi aberta. Quando o órgão abrir, a votação aparece aqui.
          </p>
        </Card>
      ) : (
        <Card className="mt-4 overflow-hidden">
          <h2 className="font-heading text-sm font-bold text-grafite-900 mb-1">
            {consultaAberta ? 'Consulta pública' : 'Resultado da consulta pública'}
          </h2>
          <p className="text-xs text-grafite-500 mb-4">
            Seu voto é secreto (nunca vinculado ao seu nome publicamente) e consultivo — não obriga a
            decisão final do governo, mas gera um registro oficial de opinião.
            {consultaAberta && fimConsulta && ` A consulta fica aberta até ${fimConsulta}.`}
          </p>

          {resultado && (
            <VotoBar favor={resultado.votos_favor} contra={resultado.votos_contra} className="mb-4" />
          )}

          {consultaAberta ? (
            <>
              <AnimatePresence mode="wait">{areaDeVoto()}</AnimatePresence>
              {erroVoto && <p className="text-xs text-status-vermelho-500 mt-2">{erroVoto}</p>}
              <p className="text-xs text-grafite-500 mt-4">
                Nesta versão a conta é identificada só por e-mail e senha — ainda não há checagem de CPF ou
                gov.br, então o resultado é um termômetro de opinião, não uma votação oficial.
              </p>
            </>
          ) : (
            <div className={`${caixaAviso} bg-grafite-100 text-grafite-700`}>
              {projetoAtual.status === 'em_consulta'
                ? `O prazo da consulta terminou${fimConsulta ? ` em ${fimConsulta}` : ''}. Aguardando a decisão do órgão.`
                : 'A consulta pública foi encerrada. Não é mais possível votar.'}
              {jaVotou && comprovante && (
                <p className="mt-1.5">
                  Seu comprovante: <code className="text-xs break-all">{comprovante.slice(0, 16)}</code>
                </p>
              )}
            </div>
          )}

          <VerificarComprovante projetoId={projetoAtual.id} />
        </Card>
      )}
    </div>
  )
}
