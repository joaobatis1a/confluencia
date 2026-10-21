import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import Topografia from '../../../components/Topografia'
import Contador from '../../../components/Contador'
import {
  CATEGORIAS,
  STATUS_RESPOSTA_LABELS,
  type PerfilPublico,
  type PostRepercussao,
  type RespostaOficial,
} from '../../../types/database'
import { formatRelativo } from '../../../lib/repercussao'
import { buscarPerfis, corAvatar, invalidarPerfil, nomePublico } from '../perfis'
import { useBairrosSeguidos } from '../useBairrosSeguidos'
import { Avatar, SeloOrgao } from '../components/Autor'
import IconeCategoria from '../components/IconeCategoria'
import { CATEGORIA_RGB, rgb } from '../cores'

const APELIDO_VALIDO = /^[a-z0-9_.]{3,20}$/

// Perfil público: quem é a pessoa no Feed (por apelido, nunca o nome completo
// em destaque), o que ela já relatou e o que isso mudou na cidade.
export default function PerfilPublicoPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<PerfilPublico | null | undefined>(undefined)
  const [relatos, setRelatos] = useState<PostRepercussao[]>([])
  const [respostas, setRespostas] = useState<RespostaOficial[]>([])
  const [editando, setEditando] = useState(false)
  const [versao, setVersao] = useState(0)
  const meu = user?.id === id

  useEffect(() => {
    if (!id) return
    let cancelado = false
    ;(async () => {
      const mapa = await buscarPerfis([id])
      const p = mapa.get(id) ?? null
      const [{ data: posts }, { data: resps }] = await Promise.all([
        supabase.from('posts_repercussao').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        p?.institucional_verificado
          ? supabase.from('respostas_oficiais').select('*').eq('orgao_id', id).order('created_at', { ascending: false }).limit(20)
          : Promise.resolve({ data: [] }),
      ])
      if (cancelado) return
      setPerfil(p)
      setRelatos((posts ?? []) as PostRepercussao[])
      setRespostas((resps ?? []) as RespostaOficial[])
    })()
    return () => {
      cancelado = true
    }
  }, [id, versao])

  if (perfil === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-amarelo-300 border-t-amarelo-700" />
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="font-heading text-3xl font-extrabold text-grafite-900">Perfil não encontrado</p>
        <Link to="/feed" className="mt-6 inline-flex rounded-full bg-amarelo-500 px-5 py-2.5 text-sm font-bold text-grafite-900">
          Voltar ao Feed
        </Link>
      </div>
    )
  }

  const apoios = relatos.reduce((s, r) => s + r.interacoes, 0)
  const comentarios = relatos.reduce((s, r) => s + (r.comentarios ?? 0), 0)
  const mudaram = relatos.filter((r) => r.status_oficial === 'virou_projeto' || r.status_oficial === 'resolvido').length
  const selos = [
    perfil.institucional_verificado && { texto: 'Órgão verificado', cor: 'bg-status-azul-50 text-status-azul-700' },
    relatos.length >= 3 && { texto: 'Vizinho ativo', cor: 'bg-amarelo-100 text-amarelo-900' },
    mudaram > 0 && { texto: 'Relato que mudou a cidade', cor: 'bg-status-verde-50 text-status-verde-700' },
    apoios >= 5 && { texto: 'Voz apoiada', cor: 'bg-categoria-rosa-50 text-categoria-rosa-700' },
  ].filter(Boolean) as { texto: string; cor: string }[]

  const cor = corAvatar(perfil.id)
  const numeros = perfil.institucional_verificado
    ? [
        { valor: respostas.length, rotulo: 'respostas a relatos' },
        { valor: respostas.filter((r) => r.status === 'virou_projeto').length, rotulo: 'viraram projeto' },
        { valor: respostas.filter((r) => r.status === 'resolvido').length, rotulo: 'resolvidos' },
      ]
    : [
        { valor: relatos.length, rotulo: relatos.length === 1 ? 'relato' : 'relatos' },
        { valor: apoios, rotulo: 'apoios recebidos' },
        { valor: comentarios, rotulo: 'comentários' },
      ]

  return (
    <div>
      {/* Capa ------------------------------------------------------------- */}
      <section className="relative h-56 overflow-hidden sm:h-64" style={{ background: cor }}>
        <Topografia semente={perfil.id.charCodeAt(0) / 7} className="absolute inset-0 h-full w-full text-white/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="-mt-16 flex flex-wrap items-end justify-between gap-4">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="rounded-full bg-grafite-50 p-1.5"
          >
            <Avatar perfil={perfil} size={120} />
          </motion.div>
          {meu && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="mb-2 rounded-full border-2 border-grafite-200 bg-white px-5 py-2.5 text-sm font-bold text-grafite-900 transition-colors hover:border-amarelo-500"
            >
              Editar perfil público
            </button>
          )}
        </div>

        <h1 className="mt-4 flex flex-wrap items-center gap-3 font-heading text-4xl font-extrabold text-grafite-900 sm:text-5xl">
          {nomePublico(perfil)}
          {perfil.institucional_verificado && <SeloOrgao />}
        </h1>
        <p className="mt-1 text-sm text-grafite-500">
          {perfil.bairro ? `${perfil.bairro} · ` : ''}
          {perfil.created_at
            ? `no Confluência desde ${new Date(perfil.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
            : ''}
        </p>
        {perfil.bio && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-grafite-800">{perfil.bio}</p>}
        {meu && !perfil.apelido && (
          <p className="mt-4 max-w-xl rounded-2xl bg-amarelo-50 px-4 py-3 text-sm text-amarelo-900">
            Você ainda não escolheu um apelido — no Feed aparece só seu primeiro nome. Toque em "Editar perfil público".
          </p>
        )}

        {selos.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {selos.map((s, i) => (
              <motion.span
                key={s.texto}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 400, damping: 18 }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${s.cor}`}
              >
                ★ {s.texto}
              </motion.span>
            ))}
          </div>
        )}

        <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-[24px] border border-grafite-200 bg-grafite-200">
          {numeros.map((n) => (
            <div key={n.rotulo} className="bg-white px-5 py-5">
              <dd className="font-heading text-4xl font-extrabold text-grafite-900">
                <Contador valor={n.valor} />
              </dd>
              <dt className="text-sm text-grafite-500">{n.rotulo}</dt>
            </div>
          ))}
        </dl>

        {meu && <MeusBairros />}

        {/* Histórico -------------------------------------------------------- */}
        {perfil.institucional_verificado ? (
          <section className="mt-12 pb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-amarelo-700">Respostas a relatos</h2>
            {respostas.length === 0 ? (
              <p className="mt-4 text-sm text-grafite-500">Este órgão ainda não respondeu nenhum relato.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {respostas.map((r) => (
                  <li key={r.id}>
                    <Link to={`/feed/${r.post_id}`} className="block rounded-[20px] border border-grafite-200 bg-white p-5 transition-shadow hover:shadow-md">
                      <span className="flex items-center justify-between gap-2 text-xs">
                        <b className="text-status-azul-700">{STATUS_RESPOSTA_LABELS[r.status]}</b>
                        <span className="text-grafite-500">{formatRelativo(r.created_at)}</span>
                      </span>
                      <span className="mt-2 block text-sm text-grafite-800 line-clamp-2">{r.texto}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="mt-12 pb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-amarelo-700">
              {meu ? 'Seus relatos' : 'Relatos'}
            </h2>
            {meu && relatos.some((r) => r.anonimo) && (
              <p className="mt-2 text-xs text-grafite-500">Os marcados como anônimos só aparecem aqui para você.</p>
            )}
            {relatos.length === 0 ? (
              <p className="mt-4 text-sm text-grafite-500">
                {meu ? 'Você ainda não relatou nada.' : 'Nenhum relato público ainda.'}
              </p>
            ) : (
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {relatos.map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 6) * 0.05 }}
                  >
                    <CartaoRelatoPerfil relato={r} />
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <AnimatePresence>
        {editando && meu && (
          <EditarPerfil
            perfil={perfil}
            onFechar={() => setEditando(false)}
            onSalvo={() => {
              invalidarPerfil(perfil.id)
              setEditando(false)
              setVersao((v) => v + 1)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CartaoRelatoPerfil({ relato }: { relato: PostRepercussao }) {
  const categoria = CATEGORIAS.find((c) => c.value === relato.categoria)?.label ?? relato.categoria
  const corCat = rgb(CATEGORIA_RGB[relato.categoria])
  return (
    <Link
      to={`/feed/${relato.id}`}
      className="group flex h-full gap-4 rounded-[24px] border border-grafite-200 bg-white p-5 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgba(27,24,19,0.45)]"
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] text-white" style={{ background: corCat }}>
        <IconeCategoria categoria={relato.categoria} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: corCat }}>
          {categoria} · {relato.bairro}
          {relato.anonimo && <span className="rounded-full bg-grafite-200 px-2 py-0.5 normal-case tracking-normal text-grafite-700">anônimo</span>}
        </span>
        <span className="mt-1 block text-sm font-medium text-grafite-900 line-clamp-2">{relato.descricao}</span>
        <span className="mt-2 block text-xs text-grafite-500">
          {formatRelativo(relato.created_at)} · {relato.interacoes} apoios · {relato.comentarios ?? 0} comentários
        </span>
        {relato.status_oficial && (
          <span className="mt-2 inline-block rounded-full bg-status-verde-50 px-2.5 py-1 text-[11px] font-bold text-status-verde-700">
            Órgão: {STATUS_RESPOSTA_LABELS[relato.status_oficial]}
          </span>
        )}
      </span>
    </Link>
  )
}

function MeusBairros() {
  const { bairros, disponivel, alternar } = useBairrosSeguidos()
  if (!disponivel) return null
  return (
    <section className="mt-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-amarelo-700">Bairros que você segue</h2>
      {bairros.length === 0 ? (
        <p className="mt-2 text-sm text-grafite-500">
          Nenhum ainda. No Feed, escolha um bairro e toque em "+ Seguir" para acompanhar o que acontece lá.
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
    </section>
  )
}

function EditarPerfil({ perfil, onFechar, onSalvo }: { perfil: PerfilPublico; onFechar: () => void; onSalvo: () => void }) {
  const [apelido, setApelido] = useState(perfil.apelido ?? '')
  const [bairro, setBairro] = useState(perfil.bairro ?? '')
  const [bio, setBio] = useState(perfil.bio ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const apelidoNormal = apelido.trim().toLowerCase()
  const apelidoOk = !apelidoNormal || APELIDO_VALIDO.test(apelidoNormal)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!apelidoOk) return
    setSalvando(true)
    setErro(null)
    const { error } = await supabase
      .from('profiles')
      .update({ apelido: apelidoNormal || null, bairro: bairro.trim() || null, bio: bio.trim() || null })
      .eq('id', perfil.id)
    setSalvando(false)
    if (error) {
      setErro(
        error.code === '23505'
          ? 'Esse apelido já está em uso. Tente outro.'
          : error.message.includes('apelido')
            ? 'O perfil público ainda não está ativo no banco (falta aplicar a migration 0006).'
            : `Não foi possível salvar: ${error.message}`,
      )
      return
    }
    onSalvo()
  }

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-grafite-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-label="Editar perfil público"
    >
      <motion.form
        onSubmit={salvar}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
        className="w-full max-w-md rounded-t-[32px] bg-white p-6 sm:rounded-[32px]"
      >
        <p className="font-heading text-2xl font-extrabold text-grafite-900">Perfil público</p>
        <p className="mt-1 text-sm text-grafite-500">É assim que você aparece no Feed. Seu nome completo não é mostrado.</p>

        <label className="mt-5 block text-sm font-semibold text-grafite-900" htmlFor="apelido">
          Apelido
        </label>
        <div className={`mt-1.5 flex items-center rounded-2xl border px-3 ${apelidoOk ? 'border-grafite-300' : 'border-status-vermelho-500'}`}>
          <span className="text-grafite-500">@</span>
          <input
            id="apelido"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="ex: marina.boavista"
            maxLength={20}
            className="w-full bg-transparent px-1 py-3 text-sm text-grafite-900 focus:outline-none"
          />
        </div>
        <p className={`mt-1 text-xs ${apelidoOk ? 'text-grafite-500' : 'text-status-vermelho-700'}`}>
          3 a 20 caracteres: letras minúsculas, números, ponto ou _.
        </p>

        <label className="mt-4 block text-sm font-semibold text-grafite-900" htmlFor="bairro-perfil">
          Seu bairro
        </label>
        <input
          id="bairro-perfil"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="ex: Boa Vista"
          maxLength={80}
          className="mt-1.5 w-full rounded-2xl border border-grafite-300 px-4 py-3 text-sm text-grafite-900 focus:border-amarelo-500 focus:outline-none"
        />

        <label className="mt-4 block text-sm font-semibold text-grafite-900" htmlFor="bio">
          Sobre você
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="Uma frase sobre você e o seu bairro."
          className="mt-1.5 w-full resize-none rounded-2xl border border-grafite-300 px-4 py-3 text-sm text-grafite-900 focus:border-amarelo-500 focus:outline-none"
        />
        <p className="text-right text-xs text-grafite-500">{bio.length}/160</p>

        {erro && <p className="mt-2 rounded-2xl bg-status-vermelho-50 px-3 py-2 text-sm text-status-vermelho-700">{erro}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onFechar} className="flex-1 rounded-full border-2 border-grafite-200 py-3 text-sm font-bold text-grafite-900">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || !apelidoOk}
            className="flex-1 rounded-full bg-amarelo-500 py-3 text-sm font-bold text-grafite-900 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}
