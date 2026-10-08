-- Confluência — Tarefa 1.1 (Guilherme): tabela de posts do Feed
-- Como aplicar: cole no SQL Editor do painel do Supabase do projeto, ou use
-- `supabase db push` se o CLI estiver configurado.

create extension if not exists "pgcrypto";

create type categoria_post as enum (
  'mobilidade',
  'iluminacao',
  'seguranca',
  'saneamento',
  'pracas_lazer',
  'saude',
  'educacao',
  'outros'
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria categoria_post not null,
  bairro text not null,
  descricao text not null,
  foto_url text,
  latitude double precision not null,
  longitude double precision not null,
  repercussao integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_categoria_idx on posts (categoria);
create index if not exists posts_bairro_idx on posts (bairro);
create index if not exists posts_created_at_idx on posts (created_at desc);

alter table posts enable row level security;
