import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { CONTAS_DEMO, SENHA_DEMO } from '../../lib/contasDemo'
import Topografia from '../../components/Topografia'

const CONTAS = [
  { ...CONTAS_DEMO.cidada, inicial: 'M', cor: 'bg-amarelo-500 text-grafite-900', faz: 'Relata, apoia, comenta e vota' },
  { ...CONTAS_DEMO.gestor, inicial: 'S', cor: 'bg-status-azul-700 text-white', faz: 'Responde relatos e publica projetos' },
]

// Entrar — segundo passo do fluxo (landing → entrar → app). Este é o MVP: o
// cadastro está fechado e quem quiser conhecer o sistema usa uma das contas de
// demonstração listadas aqui, com e-mail e senha à mostra.
export default function LoginPage() {
  const { user, profile, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const veioDoCadastro = parametros.get('cadastro') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [entrando, setEntrando] = useState<string | null>(null)

  async function entrar(comEmail: string, comSenha: string) {
    setEntrando(comEmail)
    setError(null)
    const { error } = await signIn(comEmail, comSenha)
    setEntrando(null)
    if (error) {
      setError(error)
      return
    }
    navigate('/feed')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    entrar(email, password)
  }

  const nomeAtual = profile?.orgao_nome || profile?.nome || user?.email

  return (
    <div className="grid min-h-[100svh] bg-grafite-50 lg:grid-cols-[1fr_1.1fr]">
      {/* Painel da marca */}
      <aside className="relative hidden overflow-hidden bg-amarelo-500 lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:flex-col lg:justify-between lg:p-12">
        <Topografia semente={4.4} className="absolute inset-0 h-full w-full text-grafite-900/10" />
        <Link to="/" className="relative flex items-center gap-2.5 font-heading text-lg font-extrabold text-grafite-900">
          <img src="/logo.png" alt="" className="h-10 w-10" /> Confluência
        </Link>
        <div className="relative">
          <h2 className="font-heading text-[clamp(3rem,5.5vw,6rem)] font-extrabold leading-[0.88] tracking-[-0.04em] text-grafite-900">
            Sua cidade
            <br />
            <span className="font-serif font-normal italic tracking-[-0.02em]">tem voz.</span>
          </h2>
          <p className="mt-6 max-w-sm text-lg text-grafite-900/80">
            Relate o que vê na rua, apoie vizinhos, vote nos projetos e acompanhe cada obra até a entrega.
          </p>
        </div>
        <Link to="/" className="relative text-sm font-bold text-grafite-900 hover:underline">
          ← Voltar para o início
        </Link>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 flex items-center gap-2 font-heading font-extrabold text-grafite-900 lg:hidden">
            <img src="/logo.png" alt="" className="h-9 w-9" /> Confluência
          </Link>

          <h1 className="font-heading text-5xl font-extrabold tracking-[-0.03em] text-grafite-900">Entrar</h1>
          <p className="mt-2 text-grafite-500">Use sua conta ou uma das contas de demonstração.</p>

          {user && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-grafite-200">
              <span className="min-w-0 text-sm">
                <span className="block text-grafite-500">Você já está conectado como</span>
                <b className="block truncate text-grafite-900">{nomeAtual}</b>
              </span>
              <span className="flex flex-shrink-0 gap-2">
                <button type="button" onClick={() => signOut()} className="rounded-full px-3 py-2 text-xs font-bold text-grafite-700 hover:bg-grafite-100">
                  Trocar
                </button>
                <Link to="/feed" className="rounded-full bg-amarelo-500 px-4 py-2 text-xs font-bold text-grafite-900">
                  Continuar →
                </Link>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-grafite-900">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
                className="mt-1.5 w-full rounded-2xl border border-grafite-300 bg-white px-4 py-3.5 text-grafite-900 outline-none transition-colors focus:border-amarelo-500 focus:ring-4 focus:ring-amarelo-500/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-grafite-900">Senha</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-2xl border border-grafite-300 bg-white px-4 py-3.5 text-grafite-900 outline-none transition-colors focus:border-amarelo-500 focus:ring-4 focus:ring-amarelo-500/20"
              />
            </label>
            {error && <p className="rounded-2xl bg-status-vermelho-50 px-4 py-3 text-sm text-status-vermelho-700">{error}</p>}
            <button
              type="submit"
              disabled={entrando !== null}
              className="w-full rounded-full bg-amarelo-500 py-4 font-bold text-grafite-900 shadow-[0_14px_30px_-14px_rgba(245,184,0,0.9)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {entrando === email && email ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {/* Contas de demonstração */}
          <section className="mt-10">
            <h2 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-grafite-500">
              Contas de demonstração <span className="h-px flex-1 bg-grafite-200" />
            </h2>
            <ul className="mt-4 space-y-3">
              {CONTAS.map((c, i) => (
                <motion.li
                  key={c.email}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="rounded-[22px] bg-white p-4 ring-1 ring-grafite-200"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-heading text-lg font-extrabold ${c.cor}`}>
                      {c.inicial}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block font-heading text-grafite-900">
                        {c.nome} <span className="font-serif font-normal italic text-grafite-500">· {c.papel}</span>
                      </b>
                      <span className="block text-xs text-grafite-500">{c.faz}</span>
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl bg-grafite-50 px-3 py-2 font-mono text-xs">
                    <dt className="text-grafite-500">e-mail</dt>
                    <dd className="truncate text-grafite-900">{c.email}</dd>
                    <dt className="text-grafite-500">senha</dt>
                    <dd className="text-grafite-900">{SENHA_DEMO}</dd>
                  </dl>
                  <button
                    type="button"
                    onClick={() => entrar(c.email, SENHA_DEMO)}
                    disabled={entrando !== null}
                    className="group mt-3 flex w-full items-center justify-between rounded-full bg-grafite-100 py-2 pl-4 pr-2 text-sm font-bold text-grafite-900 transition-colors hover:bg-amarelo-500 disabled:opacity-60"
                  >
                    {entrando === c.email ? 'Entrando…' : `Entrar como ${c.papel.toLowerCase()}`}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-transform group-hover:rotate-[-45deg]">→</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </section>

          {/* Cadastro fechado no MVP */}
          <section
            className={`mt-8 rounded-[22px] p-4 text-center transition-colors ${
              veioDoCadastro ? 'bg-amarelo-100 ring-2 ring-amarelo-500' : 'bg-grafite-100'
            }`}
          >
            <button
              type="button"
              disabled
              aria-describedby="aviso-cadastro"
              className="w-full cursor-not-allowed rounded-full border-2 border-dashed border-grafite-300 py-3 text-sm font-bold text-grafite-500"
            >
              Criar conta
            </button>
            <p id="aviso-cadastro" className="mt-2 text-xs text-grafite-700">
              O cadastro de novas contas está fechado nesta versão (MVP). Para conhecer o sistema, use uma das contas de
              demonstração acima.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
