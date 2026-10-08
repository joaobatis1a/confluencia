import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import LocationPicker, { isWithinRecifeMetro } from '../../../components/LocationPicker'
import { Button, Card, FormError, Label, Select, TextArea } from '../../../components/ui'
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
    const { error: insertError } = await supabase.from('posts').insert({
      user_id: user.id,
      categoria,
      bairro: bairro.trim(),
      descricao: descricao.trim(),
      latitude: coords[0],
      longitude: coords[1],
    })
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
            <input
              className="w-full rounded-[var(--radius-field)] border border-grafite-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-amarelo-500 focus:ring-2 focus:ring-amarelo-100"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex: Boa Vista"
            />
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
          {error && <FormError>{error}</FormError>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Publicando...' : 'Publicar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
