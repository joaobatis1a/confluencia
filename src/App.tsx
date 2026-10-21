import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import FeedPage from './features/feed/pages/FeedPage'
import CreatePostPage from './features/feed/pages/CreatePostPage'
import PostDetailPage from './features/feed/pages/PostDetailPage'
import ProjetosPage from './features/projetos/pages/ProjetosPage'
import ProjetoDetailPage from './features/projetos/pages/ProjetoDetailPage'
import PainelGestorPage from './features/projetos/pages/PainelGestorPage'
import CriarProjetoPage from './features/projetos/pages/CriarProjetoPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import PerfilPage from './pages/perfil/PerfilPage'
import PerfilPublicoPage from './features/feed/pages/PerfilPublicoPage'
import RequireInstitutional from './components/RequireInstitutional'
import PageTransition from './components/PageTransition'
import NavBar from './components/NavBar'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><FeedPage /></PageTransition>} />
        <Route path="/feed" element={<PageTransition><FeedPage /></PageTransition>} />
        <Route path="/feed/novo" element={<PageTransition><CreatePostPage /></PageTransition>} />
        <Route path="/feed/:id" element={<PageTransition><PostDetailPage /></PageTransition>} />
        <Route path="/projetos" element={<PageTransition><ProjetosPage /></PageTransition>} />
        <Route
          path="/projetos/novo"
          element={
            <PageTransition>
              <RequireInstitutional>
                <CriarProjetoPage />
              </RequireInstitutional>
            </PageTransition>
          }
        />
        <Route path="/projetos/:id" element={<PageTransition><ProjetoDetailPage /></PageTransition>} />
        <Route
          path="/painel"
          element={
            <PageTransition>
              <RequireInstitutional>
                <PainelGestorPage />
              </RequireInstitutional>
            </PageTransition>
          }
        />
        <Route path="/entrar" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/cadastro" element={<PageTransition><SignupPage /></PageTransition>} />
        <Route path="/perfil" element={<PageTransition><PerfilPage /></PageTransition>} />
        <Route path="/u/:id" element={<PageTransition><PerfilPublicoPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

// Ao trocar de página, volta ao topo (o navegador mantinha a rolagem da tela anterior).
// A restauração automática do navegador também sai: ela reaplicava a rolagem
// antiga depois que a página carregava.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

function VoltarAoTopo() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function App() {
  return (
    <div className="min-h-screen bg-grafite-50">
      <VoltarAoTopo />
      <NavBar />
      <AnimatedRoutes />
    </div>
  )
}

export default App
