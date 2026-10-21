import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Contador from '../../components/Contador'
import Topografia from '../../components/Topografia'
import { formatRelativo } from '../../lib/repercussao'
import { CATEGORIAS, STATUS_LABELS, STATUS_RESPOSTA_LABELS, type PostRepercussao } from '../../types/database'
import IconeCategoria from '../../features/feed/components/IconeCategoria'
import { Avatar } from '../../features/feed/components/Autor'
import { CATEGORIA_RGB, rgb } from '../../features/feed/cores'
import { useBairrosSeguidos } from '../../features/feed/useBairrosSeguidos'
import { useProjetosSalvos } from '../../features/projetos/useProjetosSalvos'
import { MOCK_PROJETOS } from '../../features/projetos/mock'
import { FOTOS_PROJETO } from '../../features/projetos/fotos'

type Aba = 'relatos' | 'acompanhando' | 'conta'

const PERMISSOES: { acao: string; cidadao: boolean; gestor: boolean }[] = [
  { acao: 'Relatar problemas (com seu apelido ou anônimo)', cidadao: true, gestor: true },
  { acao: 'Apoiar e comentar relatos de vizinhos', cidadao: true, gestor: true },
  { acao: 'Votar em consultas públicas (voto secreto)', cidadao: true, gestor: true },
  { acao: 'Responder relatos oficialmente', cidadao: false, gestor: true },
  { acao: 'Publicar projetos e ver o painel do órgão', cidadao: false, gestor: true },
]

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

// "Minha conta" — painel pessoal: seus números, seus relatos (inclusive os
// anônimos, que só você vê), os projetos que acompanha e o que sua conta pode
// fazer. A vitrine pública fica em /u/:id.
export default function PerfilPage() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [relatos, setRelatos] = useState<PostRepercussao[] | null>(null)
  const [aba, setAba] = useState<Aba>('relatos')
  const { salvos } = useProjetosSalvos()
  const [ola] = useState(saudacao)

  useEffect(() => {
    if (!user) return
    let cancelado = false
    // Lê da view: depois da 0007 a coluna do autor fica fechada na tabela
    // `posts`, e a view devolve o user_id ao próprio autor (inclusive anônimos).
    supabase
      .from('posts_repercussao')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelado) setRelatos((data ?? []) as PostRepercussao[])
      })
    return () => {
      cancelado = true
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-amarelo-300 border-t-amarelo-700" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <img src="/logo.png" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-6 font-heading text-4xl font-extrabold text-grafite-900">Entre para ver sua conta</h1>
        <p className="mt-2 text-grafite-700">Aqui ficam seus relatos, os projetos que você acompanha e seus números.</p>
        <Link to="/entrar" className="mt-6 inline-flex rounded-full bg-amarelo-500 px-6 py-3 font-bold text-grafite-900">
          Entrar
        </Link>
      </div>
    )
  }

  const gestor = Boolean(profile?.institucional_verificado)
  const nome = profile?.orgao_nome || profile?.nome?.split(' ')[0] || user.email?.split('@')[0] || 'você'
  const perfilPublico = {
    id: user.id,
    nome: profile?.nome ?? '',
    apelido: profile?.apelido ?? null,
    bairro: profile?.bairro ?? null,
    bio: profile?.bio ?? null,
    institucional_verificado: gestor,
    orgao_nome: profile?.orgao_nome ?? null,
  }
  const apoios = relatos?.reduce((s, r) => s + r.interacoes, 0) ?? 0
  const comentarios = relatos?.reduce((s, r) => s + (r.comentarios ?? 0), 0) ?? 0
  const acompanhados = MOCK_PROJETOS.filter((p) => salvos.includes(p.id))

  const abas: { id: Aba; rotulo: string; qtd?: number }[] = [
    { id: 'relatos', rotulo: 'Meus relatos', qtd: relatos?.length },
    { id: 'acompanhando', rotulo: 'Acompanhando', qtd: acompanhados.length },
    { id: 'conta', rotulo: 'Minha conta' },
  ]

  async function sair() {
    await signOut()
    navigate('/feed')
  }

  return (
    <div className="pb-16">
      {/* Topo ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-amarelo-500">
        <Topografia semente={3.3} className="absolute inset-0 h-full w-full text-grafite-900/10" />
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6 px-5 pb-10 pt-12 sm:px-8">
          <div className="flex items-center gap-5">
            <motion.div
              initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="rounded-full bg-white p-1.5 shadow-lg"
            >
              <Avatar perfil={perfilPublico} size={88} />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-amarelo-900">{ola},</p>
              <h1 className="font-heading text-4xl font-extrabold leading-none text-grafite-900 sm:text-5xl">{nome}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-amarelo-900">
                <span className="rounded-full bg-grafite-900 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-amarelo-300">
                  {gestor ? 'Gestor público' : 'Cidadão'}
                </span>
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/u/${user.id}`}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-grafite-900 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Ver meu perfil público
            </Link>
            <button
              type="button"
              onClick={sair}
              className="rounded-full border-2 border-grafite-900/20 px-5 py-2.5 text-sm font-bold text-grafite-900 hover:border-grafite-900/50"
            >
              Sair
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Números -------------------------------------------------------- */}
        <dl className="relative z-10 -mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-grafite-200 bg-grafite-200 shadow-[0_18px_40px_-24px_rgba(27,24,19,0.45)] sm:grid-cols-4">
          {[
            { valor: relatos?.length ?? 0, rotulo: 'relatos' },
            { valor: apoios, rotulo: 'apoios recebidos' },
            { valor: comentarios, rotulo: 'comentários recebidos' },
            { valor: acompanhados.length, rotulo: 'projetos acompanhando' },
          ].map((n) => (
            <div key={n.rotulo} className="bg-white px-5 py-5">
              <dd className="font-heading text-4xl font-extrabold text-grafite-900">
                <Contador valor={n.valor} />
              </dd>
              <dt className="text-sm text-grafite-500">{n.rotulo}</dt>
            </div>
          ))}
        </dl>

        {/* Abas ----------------------------------------------------------- */}
        <div role="tablist" aria-label="Seções da conta" className="mt-10 flex gap-1 overflow-x-auto rounded-full bg-grafite-100 p-1 [scrollbar-width:none] sm:w-fit">
          {abas.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className="relative flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-bold text-grafite-900"
            >
              {aba === a.id && (
                <motion.span
                  layoutId="aba-conta"
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">
                {a.rotulo}
                {a.qtd !== undefined && <span className="ml-1.5 text-grafite-500">{a.qtd}</span>}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={aba}
            role="tabpanel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-6"
          >
            {aba === 'relatos' &&
              (relatos === null ? (
                <div className="h-32 animate-pulse rounded-[24px] bg-grafite-100" />
              ) : relatos.length === 0 ? (
                <Vazio
                  titulo="Você ainda não relatou nada"
                  texto="Viu algo errado na sua rua? Relatar leva menos de um minuto."
                  acao={{ to: '/feed/novo', rotulo: '+ Relatar problema' }}
                />
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {relatos.map((r, i) => (
                    <motion.li key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                      <CartaoMeuRelato relato={r} />
                    </motion.li>
                  ))}
                </ul>
              ))}

            {aba === 'acompanhando' &&
              (acompanhados.length === 0 ? (
                <Vazio
                  titulo="Nenhum projeto salvo"
                  texto="Toque no marcador de um projeto para acompanhar cada etapa até a entrega."
                  acao={{ to: '/projetos', rotulo: 'Ver projetos' }}
                />
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {acompanhados.map((p) => {
                    const foto = FOTOS_PROJETO[p.id]
                    return (
                      <li key={p.id}>
                        <Link
                          to={`/projetos/${p.id}`}
                          className="group flex overflow-hidden rounded-[24px] border border-grafite-200 bg-white transition-shadow hover:shadow-[0_18px_36px_-20px_rgba(27,24,19,0.45)]"
                        >
                          <span className="relative w-28 flex-shrink-0 overflow-hidden bg-grafite-200">
                            {foto && (
                              <img src={foto.url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            )}
                          </span>
                          <span className="min-w-0 p-4">
                            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-amarelo-700">{STATUS_LABELS[p.status]}</span>
                            <span className="mt-1 block font-heading text-lg font-extrabold leading-tight text-grafite-900">{p.nome}</span>
                            <span className="mt-1 block text-xs text-grafite-500 line-clamp-2">{p.descricao}</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ))}

            {aba === 'conta' && <AbaConta gestor={gestor} />}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Vazio({ titulo, texto, acao }: { titulo: string; texto: string; acao: { to: string; rotulo: string } }) {
  return (
    <div className="rounded-[28px] border-2 border-dashed border-grafite-200 px-6 py-12 text-center">
      <p className="font-heading text-2xl font-extrabold text-grafite-900">{titulo}</p>
      <p className="mt-1 text-sm text-grafite-500">{texto}</p>
      <Link to={acao.to} className="mt-5 inline-flex rounded-full bg-amarelo-500 px-5 py-2.5 text-sm font-bold text-grafite-900">
        {acao.rotulo}
      </Link>
    </div>
  )
}

function CartaoMeuRelato({ relato }: { relato: PostRepercussao }) {
  const categoria = CATEGORIAS.find((c) => c.value === relato.categoria)?.label ?? relato.categoria
  const cor = rgb(CATEGORIA_RGB[relato.categoria])
  return (
    <Link
      to={`/feed/${relato.id}`}
      className="group flex h-full gap-4 rounded-[24px] border border-grafite-200 bg-white p-5 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgba(27,24,19,0.45)]"
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] text-white" style={{ background: cor }}>
        <IconeCategoria categoria={relato.categoria} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: cor }}>
          {categoria} · {relato.bairro}
          {relato.anonimo && (
            <span className="rounded-full bg-grafite-200 px-2 py-0.5 normal-case tracking-normal text-grafite-700">anônimo — só você vê</span>
          )}
        </span>
        <span className="mt-1 block text-sm font-medium text-grafite-900 line-clamp-2">{relato.descricao}</span>
        <span className="mt-2 block text-xs text-grafite-500">
          {formatRelativo(relato.created_at)} · {relato.interacoes} apoios · {relato.comentarios ?? 0} comentários
        </span>
        <span
          className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${
            relato.status_oficial ? 'bg-status-verde-50 text-status-verde-700' : 'bg-grafite-100 text-grafite-500'
          }`}
        >
          {relato.status_oficial ? `Órgão: ${STATUS_RESPOSTA_LABELS[relato.status_oficial]}` : 'Aguardando resposta do órgão'}
        </span>
      </span>
    </Link>
  )
}

function AbaConta({ gestor }: { gestor: boolean }) {
  const { bairros, disponivel, alternar } = useBairrosSeguidos()
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-[28px] border border-grafite-200 bg-white p-6">
        <h2 className="font-heading text-xl font-extrabold text-grafite-900">O que sua conta pode fazer</h2>
        <ul className="mt-4 space-y-2.5">
          {PERMISSOES.map((p) => {
            const pode = gestor ? p.gestor : p.cidadao
            return (
              <li key={p.acao} className={`flex items-start gap-3 text-sm ${pode ? 'text-grafite-900' : 'text-grafite-500'}`}>
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    pode ? 'bg-status-verde-500 text-white' : 'bg-grafite-200 text-grafite-500'
                  }`}
                  aria-label={pode ? 'pode' : 'não pode'}
                >
                  {pode ? '✓' : '–'}
                </span>
                {p.acao}
              </li>
            )
          })}
        </ul>
        {!gestor && (
          <p className="mt-4 text-xs text-grafite-500">
            Representa um órgão público? A verificação de contas institucionais é feita pela equipe.
          </p>
        )}
      </div>

      <div className="space-y-6">
        {disponivel && (
          <div className="rounded-[28px] border border-grafite-200 bg-white p-6">
            <h2 className="font-heading text-xl font-extrabold text-grafite-900">Bairros que você segue</h2>
            {bairros.length === 0 ? (
              <p className="mt-2 text-sm text-grafite-500">
                Nenhum ainda. No Feed, escolha um bairro e toque em "+ Seguir" para ser avisado de relatos novos lá.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {bairros.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => alternar(b)}
                    title="Deixar de seguir"
                    className="group rounded-full bg-amarelo-500 px-3 py-1.5 text-xs font-bold text-grafite-900"
                  >
                    {b} <span className="opacity-50 group-hover:opacity-100">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="rounded-[28px] bg-grafite-100 p-6">
          <h2 className="font-heading text-xl font-extrabold text-grafite-900">Seu voto é secreto</h2>
          <p className="mt-2 text-sm text-grafite-700">
            Seus votos não aparecem em lugar nenhum — nem para você. O comprovante é mostrado uma única vez, logo
            após votar.
          </p>
        </div>
      </div>
    </div>
  )
}
