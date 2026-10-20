import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { gerarHashComprovante } from '../../../lib/votoHash'
import type { Projeto, VotosResultado } from '../../../types/database'
import { diasRestantes } from '../etapas'

// Tarefa 3.1 do João ("apoio nas telas de votação"): registro real do voto —
// insere em `votos` com hash gerado no cliente (src/lib/votoHash.ts) e lê o
// resultado agregado de `votos_resultado`. O bloqueio de voto duplicado é o
// UNIQUE(projeto_id, user_id) do banco: a segunda tentativa volta como 23505
// e é tratada como "você já votou".
export default function Cedula({ projeto, agora }: { projeto: Projeto; agora: number }) {
  const { user } = useAuth()
  const [voto, setVoto] = useState<'favor' | 'contra' | null>(null)
  const [comprovante, setComprovante] = useState<string | null>(null)
  const [jaVotou, setJaVotou] = useState(false)
  const [votando, setVotando] = useState<'favor' | 'contra' | null>(null)
  const [erroVoto, setErroVoto] = useState<string | null>(null)
  const [resultado, setResultado] = useState<VotosResultado | null>(null)
  const dias = diasRestantes(projeto, agora)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('votos_resultado')
      .select('*')
      .eq('projeto_id', projeto.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelado) {
          setResultado(data ?? { projeto_id: projeto.id, votos_favor: 0, votos_contra: 0, total_votos: 0 })
        }
      })
    return () => {
      cancelado = true
    }
  }, [projeto.id])

  async function votar(opcao: 'favor' | 'contra') {
    if (!user) return
    setVotando(opcao)
    setErroVoto(null)
    const hash = await gerarHashComprovante(projeto.id, user.id)
    const { error } = await supabase.from('votos').insert({
      projeto_id: projeto.id,
      user_id: user.id,
      opcao,
      hash_comprovante: hash,
    })
    setVotando(null)

    if (error) {
      if (error.code === '23505') setJaVotou(true)
      else if (error.code === '22P02')
        // id não-uuid: projeto de exemplo (mock) que ainda não existe no banco.
        setErroVoto('Este é um projeto de exemplo e ainda não está no banco. A votação funciona nos projetos publicados pelos órgãos.')
      else setErroVoto(`Não foi possível registrar o voto: ${error.message}`)
      return
    }

    setVoto(opcao)
    setComprovante(hash.slice(0, 16).toUpperCase())
    setResultado((prev) => ({
      projeto_id: projeto.id,
      votos_favor: (prev?.votos_favor ?? 0) + (opcao === 'favor' ? 1 : 0),
      votos_contra: (prev?.votos_contra ?? 0) + (opcao === 'contra' ? 1 : 0),
      total_votos: (prev?.total_votos ?? 0) + 1,
    }))
  }

  const total = resultado?.total_votos ?? 0
  const pctFavor = total ? Math.round(((resultado?.votos_favor ?? 0) / total) * 100) : 0

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-grafite-200 bg-white shadow-[0_30px_60px_-30px_rgba(27,24,19,0.35)]">
      <div className="relative overflow-hidden bg-amarelo-500 px-6 py-5">
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-10 opacity-[0.12]"
          style={{ backgroundImage: 'repeating-linear-gradient(115deg, #1b1813 0 2px, transparent 2px 22px)' }}
          animate={{ x: [0, 44] }}
          transition={{ duration: 3.5, ease: 'linear', repeat: Infinity }}
        />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-amarelo-900">Cédula · consulta pública</p>
        <p className="relative mt-1 font-heading text-2xl font-extrabold leading-tight text-grafite-900">
          Você aprova este projeto?
        </p>
        {dias !== null && (
          <p className="relative mt-1 text-sm font-semibold text-amarelo-900">
            {dias === 0 ? 'Último dia para votar' : `Faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
          </p>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-end justify-between">
          <span>
            <span className="block font-heading text-4xl font-extrabold leading-none text-status-verde-700">{pctFavor}%</span>
            <span className="text-xs text-grafite-500">a favor</span>
          </span>
          <span className="text-right">
            <span className="block font-heading text-4xl font-extrabold leading-none text-status-vermelho-700">
              {total ? 100 - pctFavor : 0}%
            </span>
            <span className="text-xs text-grafite-500">contra</span>
          </span>
        </div>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-grafite-200">
          <motion.div
            className="h-full bg-status-verde-500"
            initial={{ width: 0 }}
            animate={{ width: `${pctFavor}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="ml-auto h-full bg-status-vermelho-500"
            initial={{ width: 0 }}
            animate={{ width: `${total ? 100 - pctFavor : 0}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="mt-2 text-xs text-grafite-500">
          {total === 0 ? 'Nenhum voto ainda — seja o primeiro.' : `${total} ${total === 1 ? 'voto' : 'votos'} no total`}
        </p>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {voto ? (
              <motion.div key="recibo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                {/* Carimbo */}
                <motion.div
                  initial={{ scale: 2.4, opacity: 0, rotate: -24 }}
                  animate={{ scale: 1, opacity: 1, rotate: -8 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                  className="absolute -right-2 -top-4 z-10 rounded-xl border-[3px] border-status-verde-700 px-3 py-1.5 text-center font-heading text-sm font-extrabold uppercase leading-tight text-status-verde-700 mix-blend-multiply"
                >
                  Voto
                  <br />
                  registrado
                </motion.div>
                <div className="rounded-2xl border-2 border-dashed border-grafite-300 bg-grafite-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-grafite-500">Comprovante</p>
                  <p className="mt-1 text-sm text-grafite-900">
                    Você votou <b>{voto === 'favor' ? 'a favor' : 'contra'}</b>. Guarde o código: ele não será mostrado
                    de novo.
                  </p>
                  <p className="mt-3 rounded-lg bg-white px-3 py-2 font-mono text-sm font-semibold tracking-[0.15em] text-grafite-900">
                    {comprovante?.split('').map((c, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 + i * 0.045 }}
                      >
                        {c}
                      </motion.span>
                    ))}
                  </p>
                </div>
              </motion.div>
            ) : jaVotou ? (
              <motion.p
                key="ja-votou"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-grafite-100 p-4 text-sm text-grafite-700"
              >
                Você já votou neste projeto. Como o voto é secreto, não dá para mostrar qual opção você escolheu.
              </motion.p>
            ) : !user ? (
              <motion.div key="entrar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link
                  to="/entrar"
                  className="flex w-full items-center justify-center rounded-2xl bg-amarelo-500 px-4 py-3.5 text-sm font-bold text-grafite-900 transition-transform hover:-translate-y-0.5"
                >
                  Entre para votar
                </Link>
              </motion.div>
            ) : (
              <motion.div key="botoes" exit={{ opacity: 0, scale: 0.97 }}>
                <div className="grid grid-cols-2 gap-3">
                  {(['favor', 'contra'] as const).map((opcao) => (
                    <motion.button
                      key={opcao}
                      type="button"
                      onClick={() => votar(opcao)}
                      disabled={votando !== null}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.96 }}
                      className={`rounded-2xl px-4 py-4 text-sm font-bold transition-colors disabled:opacity-60 ${
                        opcao === 'favor'
                          ? 'bg-status-verde-500 text-white hover:bg-status-verde-700'
                          : 'border-2 border-status-vermelho-500 text-status-vermelho-700 hover:bg-status-vermelho-50'
                      }`}
                    >
                      {votando === opcao ? 'Registrando…' : opcao === 'favor' ? 'Sou a favor' : 'Sou contra'}
                    </motion.button>
                  ))}
                </div>
                {erroVoto && <p className="mt-3 text-xs text-status-vermelho-700">{erroVoto}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 border-t border-grafite-200 pt-4 text-xs text-grafite-500">
          Voto secreto e consultivo: ninguém vê sua escolha, nem o órgão. O resultado orienta a decisão, mas não a
          obriga.
        </p>
      </div>
    </div>
  )
}
