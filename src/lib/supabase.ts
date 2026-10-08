import { createClient } from '@supabase/supabase-js'

// Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu .env.local
// (copie de .env.example). Essas chaves vêm do painel do projeto no Supabase:
// Project Settings > API.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] Variáveis de ambiente ausentes. Configure .env.local a partir de .env.example. ' +
      'O app roda normalmente com dados mock, mas login e gravações reais não vão funcionar até isso ser configurado.',
  )
}

// createClient lança exceção se a URL estiver vazia/inválida — isso travaria o
// app inteiro em tela branca para quem ainda não tem um projeto Supabase real
// (ou seja, o time inteiro agora). Por isso usamos um placeholder válido como
// fallback: o cliente é criado sem erro, e qualquer chamada real (login,
// insert) simplesmente falha de forma tratada, em vez de quebrar o render.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
