import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Bairros que a pessoa segue (tabela `bairros_seguidos`, 0006). `disponivel`
// fica false sem login ou se a tabela ainda não existe no banco.
export function useBairrosSeguidos() {
  const { user } = useAuth()
  const [bairros, setBairros] = useState<string[]>([])
  const [disponivel, setDisponivel] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelado = false
    supabase
      .from('bairros_seguidos')
      .select('bairro')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelado) return
        setDisponivel(!error)
        setBairros((data ?? []).map((r) => r.bairro))
      })
    return () => {
      cancelado = true
    }
  }, [user])

  const alternar = useCallback(
    async (bairro: string) => {
      if (!user) return
      const segue = bairros.includes(bairro)
      setBairros((atual) => (segue ? atual.filter((b) => b !== bairro) : [...atual, bairro]))
      const { error } = segue
        ? await supabase.from('bairros_seguidos').delete().eq('user_id', user.id).eq('bairro', bairro)
        : await supabase.from('bairros_seguidos').insert({ user_id: user.id, bairro })
      if (error) setBairros((atual) => (segue ? [...atual, bairro] : atual.filter((b) => b !== bairro)))
    },
    [user, bairros],
  )

  return { bairros, disponivel: Boolean(user) && disponivel, alternar }
}
