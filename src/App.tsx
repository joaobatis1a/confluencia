import { NavLink, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import FeedPage from './features/feed/pages/FeedPage'
import CreatePostPage from './features/feed/pages/CreatePostPage'
import PostDetailPage from './features/feed/pages/PostDetailPage'
import ProjetosPage from './features/projetos/pages/ProjetosPage'
import ProjetoDetailPage from './features/projetos/pages/ProjetoDetailPage'
import PainelGestorPage from './features/projetos/pages/PainelGestorPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import RequireInstitutional from './components/RequireInstitutional'

function NavBar() {
  const { user, signOut } = useAuth()
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-2 rounded-[var(--radius-field)] ${
      isActive ? 'bg-amarelo-100 text-amarelo-700' : 'text-grafite-700 hover:bg-grafite-100'
    }`

  return (
    <header className="border-b border-grafite-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="h-7 w-7 rounded-full bg-amarelo-500 flex items-center justify-center mr-2">
            <span className="font-heading text-xs font-bold text-grafite-900">C</span>
          </div>
          <NavLink to="/feed" className={linkClass}>
            Feed
          </NavLink>
          <NavLink to="/projetos" className={linkClass}>
            Projetos
          </NavLink>
          <NavLink to="/painel" className={linkClass}>
            Painel de gestor
          </NavLink>
        </div>
        <div>
          {user ? (
            <button onClick={() => signOut()} className="text-sm text-grafite-500 hover:underline">
              Sair
            </button>
          ) : (
            <NavLink to="/entrar" className={linkClass}>
              Entrar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-grafite-50">
      <NavBar />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/feed/novo" element={<CreatePostPage />} />
        <Route path="/feed/:id" element={<PostDetailPage />} />
        <Route path="/projetos" element={<ProjetosPage />} />
        <Route path="/projetos/:id" element={<ProjetoDetailPage />} />
        <Route
          path="/painel"
          element={
            <RequireInstitutional>
              <PainelGestorPage />
            </RequireInstitutional>
          }
        />
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />
      </Routes>
    </div>
  )
}

export default App
