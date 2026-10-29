import { useState, type FormEvent } from 'react'
import { verificarComprovante } from '../api'
import { Button, TextField } from '../../../components/ui'

// Tarefa 3.1 / 3.3 da Ana: a parte "auditável" do voto secreto. Qualquer pessoa
// confere que um comprovante existe e em qual projeto/data — sem descobrir de
// quem é nem em que opção foi (a função do banco só devolve projeto e data).
export default function VerificarComprovante({ projetoId }: { projetoId: string }) {
  const [codigo, setCodigo] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function verificar(e: FormEvent) {
    e.preventDefault()
    if (codigo.trim().length < 16) {
      setMensagem({ tipo: 'erro', texto: 'Digite pelo menos os 16 primeiros caracteres do comprovante.' })
      return
    }
    setVerificando(true)
    setMensagem(null)
    try {
      const achado = await verificarComprovante(codigo)
      if (!achado) {
        setMensagem({ tipo: 'erro', texto: 'Comprovante não encontrado.' })
      } else {
        const quando = new Date(achado.created_at).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
        const onde = achado.projeto_id === projetoId ? 'neste projeto' : 'em outro projeto'
        setMensagem({ tipo: 'ok', texto: `Comprovante válido: voto registrado ${onde} em ${quando}.` })
      }
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: `Não foi possível verificar: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
      })
    } finally {
      setVerificando(false)
    }
  }

  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer font-semibold text-amarelo-700">Verificar um comprovante</summary>
      <form onSubmit={verificar} className="mt-3 flex flex-col sm:flex-row gap-2">
        <TextField
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Cole o código do comprovante"
          aria-label="Código do comprovante"
        />
        <Button type="submit" variant="secondary" disabled={verificando} className="sm:w-auto">
          {verificando ? 'Verificando...' : 'Verificar'}
        </Button>
      </form>
      {mensagem && (
        <p
          className={`text-xs mt-2 ${
            mensagem.tipo === 'ok' ? 'text-status-verde-700' : 'text-status-vermelho-500'
          }`}
        >
          {mensagem.texto}
        </p>
      )}
      <p className="text-xs text-grafite-500 mt-2">
        A verificação confirma que o voto existe e quando foi feito. Ela não revela quem votou nem em qual opção.
      </p>
    </details>
  )
}
