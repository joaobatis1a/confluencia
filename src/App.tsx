import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import RequireInstitutional from './components/RequireInstitutional'
import PageTransition from './components/PageTransition'
import NavBar from './components/NavBar'
import BotaoRelatar from './components/BotaoRelatar'

// Cada página vira um pedaço separado do JavaScript, baixado só quando é aberta:
// quem chega pela landing não precisa baixar o mapa 3D do Feed, e vice-versa.
const LandingPage = lazy(() => import('./pages/landing/LandingPage'))
const FeedPage = lazy(() => import('./features/feed/pages/FeedPage'))
const CreatePostPage = lazy(() => import('./features/feed/pages/CreatePostPage'))
const PostDetailPage = lazy(() => import('./features/feed/pages/PostDetailPage'))
const PerfilPublicoPage = lazy(() => import('./features/feed/pages/PerfilPublicoPage'))
const ProjetosPage = lazy(() => import('./features/projetos/pages/ProjetosPage'))
const ProjetoDetailPage = lazy(() => import('./features/projetos/pages/ProjetoDetailPage'))
const PainelGestorPage = lazy(() => import('./features/projetos/pages/PainelGestorPage'))
const CriarProjetoPage = lazy(() => import('./features/projetos/pages/CriarProjetoPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const PerfilPage = lazy(() => import('./pages/perfil/PerfilPage'))

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
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
        {/* MVP: cadastro fechado — a tela de entrar explica e lista as contas de demonstração. */}
        <Route path="/cadastro" element={<Navigate to="/entrar?cadastro=1" replace />} />
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
  // A landing ("/") e a tela de entrar são de tela cheia, com barra própria.
  const naLanding = ['/', '/entrar'].includes(useLocation().pathname)
  return (
    <div className="min-h-screen bg-grafite-50">
      <VoltarAoTopo />
      {!naLanding && <NavBar />}
      <Suspense fallback={<div className="min-h-[100svh] bg-grafite-50" />}>
        <AnimatedRoutes />
      </Suspense>
      <BotaoRelatar />
    </div>
  )
}

export default App
