-- Confluência — Tarefa 1.4 / 3.2 (Guilherme): perfil de usuário + verificação institucional
-- Um perfil é criado automaticamente (trigger) quando alguém se cadastra via Supabase Auth.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  institucional_verificado boolean not null default false,
  orgao_nome text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Cria o perfil automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
