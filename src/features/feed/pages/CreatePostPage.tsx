import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import LocationPicker, { isWithinRecifeMetro } from '../../../components/LocationPicker'
import { Button, Card, FormError, Label, Select, TextArea, TextField } from '../../../components/ui'
import { CATEGORIAS, type Categoria } from '../../../types/database'

// Tarefas 2.1 (formulário), 2.2 (coordenadas) e 3.2 (validação) do João, já unificadas.
export default function CreatePostPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categoria, setCategoria] = useState<Categoria>('mobilidade')
  const [bairro, setBairro] = useState('')
  const [descricao, setDescricao] = useState('')
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [anonimo, setAnonimo] = useState(false)
  // Segurança é sempre anônimo (o banco também força isso — 0006).
  const anonimoForcado = categoria === 'seguranca'
  const anonimoEfetivo = anonimo || anonimoForcado

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Tarefa 3.2: validação de coordenadas antes de salvar.
    if (!coords) {
      setError('Selecione a localização no mapa antes de publicar.')
      return
    }
    if (!isWithinRecifeMetro(coords)) {
      setError('A localização marcada parece estar fora da Região Metropolitana do Recife. Confira o ponto no mapa.')
      return
    }
    if (!bairro.trim() || !descricao.trim()) {
      setError('Preencha o bairro e a descrição.')
      return
    }
    if (!user) {
      setError('Você precisa estar logado para publicar. Entre ou crie uma conta.')
      return
    }

    setLoading(true)
    const relato = {
      user_id: user.id,
      categoria,
      bairro: bairro.trim(),
      descricao: descricao.trim(),
      latitude: coords[0],
      longitude: coords[1],
    }
    let { error: insertError } = await supabase.from('posts').insert({ ...relato, anonimo: anonimoEfetivo })
    // Banco ainda sem a 0006 (sem a coluna `anonimo`): publica sem o campo.
    if (insertError?.message.includes('anonimo')) {
      ;({ error: insertError } = await supabase.from('posts').insert(relato))
    }
    setLoading(false)

    if (insertError) {
      // Esperado até existir um projeto Supabase real com a tabela `posts` criada
      // (ver supabase/migrations/). O formulário e a validação já estão prontos.
      setError(`Não foi possível salvar: ${insertError.message}`)
      return
    }

    navigate('/feed')
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-grafite-900 mb-1">Relatar problema</h1>
      <p className="text-sm text-grafite-500 mb-6">
        Conte o que está acontecendo e marque onde é — isso ajuda a priorizar sua região.
      </p>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Categoria</Label>
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Bairro</Label>
            <TextField value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Boa Vista" />
          </div>
          <div>
            <Label>Descrição</Label>
            <TextArea
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema com detalhes."
            />
          </div>
          <LocationPicker value={coords} onChange={setCoords} />

          <div
            className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors ${
              anonimoEfetivo ? 'border-grafite-900 bg-grafite-100' : 'border-grafite-200 bg-white'
            }`}
          >
            <button
              type="button"
              role="switch"
              aria-checked={anonimoEfetivo}
              aria-label="Publicar sem mostrar quem relatou"
              disabled={anonimoForcado}
              onClick={() => setAnonimo((v) => !v)}
              className={`relative mt-0.5 h-7 w-12 flex-shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${
                anonimoEfetivo ? 'bg-grafite-900' : 'bg-grafite-300'
              }`}
            >
              <motion.span
                className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow"
                animate={{ x: anonimoEfetivo ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 32 }}
              />
            </button>
            <span>
              <span className="block text-sm font-semibold text-grafite-900">Publicar anônimo</span>
              <span className="block text-xs text-grafite-700">
                {anonimoForcado
                  ? 'Relatos de segurança são sempre anônimos, para proteger quem denuncia.'
                  : anonimoEfetivo
                    ? 'Ninguém verá quem relatou — nem pela API. O relato continua sendo seu no seu perfil.'
                    : 'Seu apelido aparece no relato e ele entra no seu perfil público.'}
              </span>
            </span>
          </div>

          {error && <FormError>{error}</FormError>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Publicando...' : 'Publicar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
