import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, FormError, Label, TextField } from '../../components/ui'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/feed')
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-4">
      <h1 className="font-heading text-2xl font-bold text-grafite-900 mb-1">Entrar</h1>
      <p className="text-sm text-grafite-500 mb-6">Acesse sua conta do Confluência.</p>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <TextField
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <Label>Senha</Label>
            <TextField
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <FormError>{error}</FormError>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
      <p className="text-sm text-grafite-500 mt-4 text-center">
        Não tem conta?{' '}
        <Link to="/cadastro" className="text-amarelo-700 font-semibold hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
