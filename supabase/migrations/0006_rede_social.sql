-- Confluência — 0006 (João): camada social do Feed
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

-- Sem isto o anonimato seria só visual: qualquer um leria `user_id` direto
-- da tabela pela API. O público lê `posts` sem a coluna do autor; o autor só
-- aparece pela view abaixo, que o esconde quando o relato é anônimo.
revoke select on posts from anon, authenticated;
grant select (id, categoria, bairro, descricao, foto_url, latitude, longitude, repercussao, created_at, anonimo)
  on posts to anon, authenticated;

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
