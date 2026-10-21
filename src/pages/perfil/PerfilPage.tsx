import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// /perfil é só um atalho: o perfil é uma página só, em /u/:id. Quando é o seu,
// ela mostra também as abas privadas (acompanhando, bairros, conta).
export default function PerfilPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-amarelo-300 border-t-amarelo-700" />
      </div>
    )
  }

  if (user) return <Navigate to={`/u/${user.id}`} replace />

  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <img src="/logo.png" alt="" className="mx-auto h-16 w-16" />
      <h1 className="mt-6 font-heading text-4xl font-extrabold text-grafite-900">Entre para ver seu perfil</h1>
      <p className="mt-2 text-grafite-700">Aqui ficam seus relatos, os projetos que você acompanha e seus números.</p>
      <Link to="/entrar" className="mt-6 inline-flex rounded-full bg-amarelo-500 px-6 py-3 font-bold text-grafite-900">
        Entrar
      </Link>
    </div>
  )
}
