-- Confluência — 0008 (João): camada social do Feed
-- Perfil público por apelido, relato anônimo de verdade, comentários,
-- resposta oficial do órgão e seguir bairro.
-- Como aplicar: SQL Editor do Supabase, depois das migrations 0001 → 0005.
-- É idempotente: pode rodar de novo sem quebrar.

-- 1. Perfil público --------------------------------------------------------
-- O nome real continua no perfil, mas o que aparece no Feed é o apelido.
alter table profiles add column if not exists apelido text;
alter table profiles add column if not exists bairro text;
alter table profiles add column if not exists bio text;

do $$ begin
  alter table profiles add constraint profiles_apelido_formato
    check (apelido is null or apelido ~ '^[a-z0-9_.]{3,20}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table profiles add constraint profiles_bio_tamanho
    check (bio is null or char_length(bio) <= 160);
exception when duplicate_object then null; end $$;

create unique index if not exists profiles_apelido_unico on profiles (lower(apelido));

-- O usuário edita só os campos do próprio perfil público (a 0004 já revogou o
-- UPDATE geral; institucional_verificado continua bloqueado).
grant update (nome, apelido, bairro, bio) on profiles to authenticated;

-- 2. Relato anônimo --------------------------------------------------------
alter table posts add column if not exists anonimo boolean not null default false;

-- Quem denuncia segurança (assalto, tráfico…) nunca aparece: anônimo forçado no banco.
create or replace function posts_forcar_anonimo() returns trigger
language plpgsql as $$
begin
  if new.categoria = 'seguranca' then
    new.anonimo := true;
  end if;
  return new;
end $$;

drop trigger if exists posts_forcar_anonimo on posts;
create trigger posts_forcar_anonimo
  before insert or update on posts
  for each row execute function posts_forcar_anonimo();

update posts set anonimo = true where categoria = 'seguranca' and not anonimo;

-- ATENÇÃO: aqui o anonimato ainda é só da interface — a tabela `posts` segue
-- legível com `user_id`. Quem fecha isso é a 0009_fechar_autor.sql, que deve
-- rodar junto com o merge da branch `repaginada` (a `main` antiga ainda lê
-- `posts` direto e quebraria se a coluna fosse fechada antes).

-- 3. Comentários -----------------------------------------------------------
create table if not exists comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists comentarios_post_idx on comentarios (post_id, created_at);
alter table comentarios enable row level security;

drop policy if exists "comentarios: leitura publica" on comentarios;
create policy "comentarios: leitura publica" on comentarios for select using (true);
drop policy if exists "comentarios: comentar exige login" on comentarios;
create policy "comentarios: comentar exige login" on comentarios for insert with check (auth.uid() = user_id);
drop policy if exists "comentarios: apagar o proprio" on comentarios;
create policy "comentarios: apagar o proprio" on comentarios for delete using (auth.uid() = user_id);

-- 4. Resposta oficial do órgão ---------------------------------------------
do $$ begin
  create type status_resposta as enum ('recebido', 'em_analise', 'virou_projeto', 'resolvido', 'nao_procede');
exception when duplicate_object then null; end $$;

create table if not exists respostas_oficiais (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  orgao_id uuid not null references profiles(id) on delete cascade,
  status status_resposta not null,
  texto text not null check (char_length(texto) between 1 and 600),
  projeto_id uuid references projetos(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists respostas_post_idx on respostas_oficiais (post_id, created_at);
alter table respostas_oficiais enable row level security;

drop policy if exists "respostas: leitura publica" on respostas_oficiais;
create policy "respostas: leitura publica" on respostas_oficiais for select using (true);
drop policy if exists "respostas: so orgao verificado responde" on respostas_oficiais;
create policy "respostas: so orgao verificado responde" on respostas_oficiais for insert
  with check (
    auth.uid() = orgao_id
    and exists (select 1 from profiles where id = auth.uid() and institucional_verificado = true)
  );

-- 5. Seguir bairro ---------------------------------------------------------
create table if not exists bairros_seguidos (
  user_id uuid not null references profiles(id) on delete cascade,
  bairro text not null check (char_length(bairro) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, bairro)
);
alter table bairros_seguidos enable row level security;

drop policy if exists "bairros: ver os proprios" on bairros_seguidos;
create policy "bairros: ver os proprios" on bairros_seguidos for select using (auth.uid() = user_id);
drop policy if exists "bairros: seguir" on bairros_seguidos;
create policy "bairros: seguir" on bairros_seguidos for insert with check (auth.uid() = user_id);
drop policy if exists "bairros: deixar de seguir" on bairros_seguidos;
create policy "bairros: deixar de seguir" on bairros_seguidos for delete using (auth.uid() = user_id);

-- 6. View do Feed (substitui a da 0005) -------------------------------------
-- Sem security_invoker: a view precisa ler `posts.user_id` (fechada para o
-- público acima) para devolvê-lo só quando o relato não é anônimo — ou
-- quando quem consulta é o próprio autor.
drop view if exists posts_repercussao;
create view posts_repercussao as
select
  p.id,
  case when p.anonimo and p.user_id is distinct from auth.uid() then null else p.user_id end as user_id,
  p.anonimo,
  p.categoria, p.bairro, p.descricao, p.foto_url,
  p.latitude, p.longitude, p.created_at,
  r.recorrencia,
  i.interacoes,
  (r.recorrencia + i.interacoes) as repercussao,
  c.comentarios,
  o.status as status_oficial
from posts p
cross join lateral (
  select count(*)::int as recorrencia
  from posts s
  where s.categoria = p.categoria
    and s.bairro = p.bairro
    and s.id <> p.id
    and s.created_at >= now() - interval '30 days'
) r
cross join lateral (
  select count(*)::int as interacoes from post_apoios a where a.post_id = p.id
) i
cross join lateral (
  select count(*)::int as comentarios from comentarios k where k.post_id = p.id
) c
left join lateral (
  select ro.status from respostas_oficiais ro where ro.post_id = p.id order by ro.created_at desc limit 1
) o on true;

grant select on posts_repercussao to anon, authenticated;

-- 7. Notificações -----------------------------------------------------------
-- Criadas só pelo banco (gatilhos abaixo); a pessoa lê e marca como lida as
-- próprias. Não há policy de insert: ninguém notifica outra pessoa pela API.
create table if not exists notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tipo text not null check (tipo in ('resposta_oficial', 'comentario', 'apoio', 'novo_relato_bairro')),
  titulo text not null,
  texto text,
  link text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notificacoes_user_idx on notificacoes (user_id, created_at desc);
alter table notificacoes enable row level security;

drop policy if exists "notificacoes: ver as proprias" on notificacoes;
create policy "notificacoes: ver as proprias" on notificacoes for select using (auth.uid() = user_id);
drop policy if exists "notificacoes: marcar as proprias" on notificacoes;
create policy "notificacoes: marcar as proprias" on notificacoes for update using (auth.uid() = user_id);
drop policy if exists "notificacoes: apagar as proprias" on notificacoes;
create policy "notificacoes: apagar as proprias" on notificacoes for delete using (auth.uid() = user_id);
-- Do conteúdo, a pessoa só altera o "lida".
revoke update on notificacoes from authenticated;
grant update (lida) on notificacoes to authenticated;

create or replace function nome_publico(p_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    case when institucional_verificado then orgao_nome end,
    '@' || apelido,
    nullif(split_part(nome, ' ', 1), ''),
    'Alguém'
  )
  from profiles where id = p_id
$$;

create or replace function notificar_resposta_oficial() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_autor uuid;
begin
  select user_id into v_autor from posts where id = new.post_id;
  if v_autor is not null and v_autor <> new.orgao_id then
    insert into notificacoes (user_id, tipo, titulo, texto, link)
    values (v_autor, 'resposta_oficial', coalesce(nome_publico(new.orgao_id), 'O órgão') || ' respondeu seu relato',
            left(new.texto, 140), '/feed/' || new.post_id);
  end if;
  return new;
end $$;
drop trigger if exists notificar_resposta_oficial on respostas_oficiais;
create trigger notificar_resposta_oficial after insert on respostas_oficiais
  for each row execute function notificar_resposta_oficial();

create or replace function notificar_comentario() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_autor uuid;
begin
  select user_id into v_autor from posts where id = new.post_id;
  if v_autor is not null and v_autor <> new.user_id then
    insert into notificacoes (user_id, tipo, titulo, texto, link)
    values (v_autor, 'comentario', coalesce(nome_publico(new.user_id), 'Alguém') || ' comentou no seu relato',
            left(new.texto, 140), '/feed/' || new.post_id);
  end if;
  return new;
end $$;
drop trigger if exists notificar_comentario on comentarios;
create trigger notificar_comentario after insert on comentarios
  for each row execute function notificar_comentario();

create or replace function notificar_apoio() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_autor uuid;
begin
  select user_id into v_autor from posts where id = new.post_id;
  if v_autor is not null and v_autor <> new.user_id then
    insert into notificacoes (user_id, tipo, titulo, link)
    values (v_autor, 'apoio', 'Seu relato recebeu um apoio', '/feed/' || new.post_id);
  end if;
  return new;
end $$;
drop trigger if exists notificar_apoio on post_apoios;
create trigger notificar_apoio after insert on post_apoios
  for each row execute function notificar_apoio();

-- Relato novo num bairro seguido. Não revela o autor (pode ser anônimo).
create or replace function notificar_novo_relato_bairro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notificacoes (user_id, tipo, titulo, texto, link)
  select bs.user_id, 'novo_relato_bairro', 'Novo relato em ' || new.bairro, left(new.descricao, 140), '/feed/' || new.id
  from bairros_seguidos bs
  where lower(bs.bairro) = lower(new.bairro) and bs.user_id <> new.user_id;
  return new;
end $$;
drop trigger if exists notificar_novo_relato_bairro on posts;
create trigger notificar_novo_relato_bairro after insert on posts
  for each row execute function notificar_novo_relato_bairro();

-- Tempo real: o sino atualiza sem recarregar a página.
do $$ begin
  alter publication supabase_realtime add table notificacoes;
exception when others then null; end $$;
