import { createClient } from '@supabase/supabase-js'

// Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu .env.local
// (copie de .env.example). Essas chaves vêm do painel do projeto no Supabase:
// Project Settings > API.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Variáveis de ambiente ausentes. Configure .env.local a partir de .env.example.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
