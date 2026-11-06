import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEhGestor } from '../context/useEhGestor'

/**
 * Mesma rota, duas telas: conta de órgão público vê a central de trabalho;
 * morador e visitante veem a tela pública. O órgão pode olhar a pública com
 * `?visao=morador` (link "Ver como a população vê").
 */
export default function PorVisao({ morador, gestor }: { morador: ReactNode; gestor: ReactNode }) {
  const { user } = useAuth()
  const ehGestor = useEhGestor() && Boolean(user)
  const [params] = useSearchParams()
  return ehGestor && params.get('visao') !== 'morador' ? gestor : morador
}
