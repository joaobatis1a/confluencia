import type { Post } from '../../types/database'

// Dados mock — Tarefa 2.1 do João ("telas estáticas, posts inventados").
// Quando o Supabase estiver configurado, troque pelo fetch real (ver comentário em FeedPage.tsx).
export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user_id: 'mock-user-1',
    categoria: 'iluminacao',
    bairro: 'Boa Vista',
    descricao: 'Poste apagado há mais de duas semanas na esquina da Rua da Aurora.',
    foto_url: null,
    latitude: -8.0589,
    longitude: -34.8817,
    repercussao: 12,
    created_at: '2026-10-05T14:00:00Z',
  },
  {
    id: '2',
    user_id: 'mock-user-2',
    categoria: 'mobilidade',
    bairro: 'Boa Viagem',
    descricao: 'Semáforo com defeito causando engarrafamento todo início de noite.',
    foto_url: null,
    latitude: -8.1259,
    longitude: -34.9037,
    repercussao: 27,
    created_at: '2026-10-04T09:30:00Z',
  },
  {
    id: '3',
    user_id: 'mock-user-3',
    categoria: 'saneamento',
    bairro: 'Várzea',
    descricao: 'Vazamento de esgoto a céu aberto próximo à praça central.',
    foto_url: null,
    latitude: -8.0476,
    longitude: -34.9508,
    repercussao: 34,
    created_at: '2026-10-03T18:15:00Z',
  },
  {
    id: '4',
    user_id: 'mock-user-1',
    categoria: 'pracas_lazer',
    bairro: 'Casa Amarela',
    descricao: 'Praça sem manutenção, mato alto e brinquedos quebrados.',
    foto_url: null,
    latitude: -8.0252,
    longitude: -34.9208,
    repercussao: 8,
    created_at: '2026-10-02T11:00:00Z',
  },
]
