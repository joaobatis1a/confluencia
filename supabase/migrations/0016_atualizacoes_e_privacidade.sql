-- Confluência — Semana 5 (auditoria): atualizações de projeto com histórico e
-- regras no servidor, e privacidade dos perfis.
--
-- 1. Atualizar um projeto agora passa por publicar_atualizacao(): o servidor
--    confere que é o órgão dono (verificado), que a mudança de etapa é permitida,
--    que o marco existe e ainda não foi feito, e grava o histórico com texto e
--    foto. Antes, essas regras só existiam na tela: pela API o órgão dono podia
--    pular etapas, reabrir um projeto rejeitado ou reescrever datas sem rastro.
-- 2. profiles deixa de ser legível por qualquer um. A tela mostra só o primeiro
--    nome, mas a API devolvia o nome completo de todas as contas. Agora o público
--    lê a view perfis_publicos (primeiro nome, apelido, bairro, bio, selos) e
--    cada pessoa lê a própria linha inteira.
-- Rode DEPOIS da 0015. Idempotente.

-- 1. Histórico de atualizações ---------------------------------------------------
create table if not exists public.projeto_atualizacoes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  orgao_id uuid not null references auth.users(id),
  texto text check (texto is null or char_length(texto) <= 500),
  foto_url text check (public.url_de_foto_valida(foto_url)),
  status_de public.status_projeto,
  status_para public.status_projeto,
  marco_nome text,
  marco_data date,
  created_at timestamptz not null default now(),
  check (texto is not null or status_para is not null or marco_nome is not null)
);

create index if not exists projeto_atualizacoes_projeto_idx
  on public.projeto_atualizacoes (projeto_id, created_at desc);

alter table public.projeto_atualizacoes enable row level security;

-- Lê quem pode ler o projeto (rejeitado só para o órgão dono). Ninguém insere direto.
drop policy if exists "atualizacoes: leitura segue o projeto" on public.projeto_atualizacoes;
create policy "atualizacoes: leitura segue o projeto"
  on public.projeto_atualizacoes for select
  using (exists (select 1 from public.projetos p where p.id = projeto_id));

revoke insert, update, delete on public.projeto_atualizacoes from anon, authenticated;
grant select on public.projeto_atualizacoes to anon, authenticated;

-- 2. A função que publica ----------------------------------------------------------
create or replace function public.publicar_atualizacao(
  p_projeto_id uuid,
  p_marco integer default null,
  p_data_real date default null,
  p_novo_status public.status_projeto default null,
  p_consulta_fim timestamptz default null,
  p_texto text default null,
  p_foto_url text default null
)
returns public.projetos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_proj public.projetos%rowtype;
  v_texto text := nullif(trim(coalesce(p_texto, '')), '');
  v_marco_nome text;
  v_timeline jsonb;
  v_antes public.status_projeto;
begin
  if v_user is null then
    raise exception 'Entre com a conta do órgão para publicar.' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where id = v_user and institucional_verificado) then
    raise exception 'Só contas de órgão público verificadas publicam atualizações.' using errcode = '42501';
  end if;

  select * into v_proj from public.projetos where id = p_projeto_id for update;
  if not found or v_proj.orgao_id <> v_user then
    raise exception 'Você não tem permissão para atualizar este projeto.' using errcode = '42501';
  end if;

  if p_marco is null and p_novo_status is null and v_texto is null and p_consulta_fim is null then
    raise exception 'Informe um marco, uma nova etapa ou um texto.' using errcode = 'CF020';
  end if;
  if v_texto is not null and char_length(v_texto) > 500 then
    raise exception 'O texto passa de 500 caracteres.' using errcode = 'CF020';
  end if;
  if not public.url_de_foto_valida(p_foto_url) then
    raise exception 'A foto precisa vir do envio do próprio sistema.' using errcode = 'CF020';
  end if;

  v_antes := v_proj.status;

  -- Etapa: só o caminho previsto, nunca pular nem voltar.
  if p_novo_status is not null and p_novo_status <> v_proj.status then
    if not (
      (v_proj.status = 'proposto' and p_novo_status = 'em_consulta') or
      (v_proj.status = 'em_consulta' and p_novo_status in ('aprovado', 'rejeitado')) or
      (v_proj.status = 'aprovado' and p_novo_status = 'em_execucao') or
      (v_proj.status = 'em_execucao' and p_novo_status = 'concluido')
    ) then
      raise exception 'Não dá para ir de "%" para "%".', v_proj.status, p_novo_status using errcode = 'CF021';
    end if;
    if p_novo_status = 'em_consulta' and (p_consulta_fim is null or p_consulta_fim <= now()) then
      raise exception 'Informe até quando a consulta pública fica aberta (uma data no futuro).' using errcode = 'CF020';
    end if;
  end if;

  -- Prorrogar a consulta: só com o projeto em consulta e para uma data maior.
  if p_consulta_fim is not null and p_novo_status is distinct from 'em_consulta' then
    if v_proj.status <> 'em_consulta' then
      raise exception 'Só dá para mudar o prazo de um projeto em consulta.' using errcode = 'CF021';
    end if;
    if p_consulta_fim <= now() or (v_proj.consulta_fim is not null and p_consulta_fim <= v_proj.consulta_fim) then
      raise exception 'O novo prazo precisa ser depois do atual.' using errcode = 'CF020';
    end if;
  end if;

  -- Marco: existe, ainda não foi feito, data real não é futura.
  v_timeline := v_proj.timeline;
  if p_marco is not null then
    if p_marco < 0 or p_marco >= jsonb_array_length(v_timeline) then
      raise exception 'Esse marco não existe.' using errcode = 'CF021';
    end if;
    if (v_timeline -> p_marco ->> 'data_real') is not null then
      raise exception 'Esse marco já foi concluído.' using errcode = 'CF021';
    end if;
    if p_data_real is null or p_data_real > current_date then
      raise exception 'A data de conclusão precisa existir e não pode ser futura.' using errcode = 'CF020';
    end if;
    v_marco_nome := v_timeline -> p_marco ->> 'nome';
    v_timeline := jsonb_set(v_timeline, array[p_marco::text, 'data_real'], to_jsonb(p_data_real::text));
  end if;

  update public.projetos
  set timeline = v_timeline,
      status = coalesce(p_novo_status, status),
      consulta_fim = coalesce(p_consulta_fim, consulta_fim)
  where id = p_projeto_id
  returning * into v_proj;

  insert into public.projeto_atualizacoes (projeto_id, orgao_id, texto, foto_url, status_de, status_para, marco_nome, marco_data)
  values (
    p_projeto_id, v_user, v_texto, nullif(p_foto_url, ''),
    case when p_novo_status is distinct from v_antes then v_antes end,
    case when p_novo_status is distinct from v_antes then p_novo_status end,
    v_marco_nome, p_data_real
  );

  return v_proj;
end;
$$;

revoke all on function public.publicar_atualizacao(uuid, integer, date, public.status_projeto, timestamptz, text, text) from public, anon;
grant execute on function public.publicar_atualizacao(uuid, integer, date, public.status_projeto, timestamptz, text, text) to authenticated;

-- Etapa, marcos e prazo só mudam pela função acima (nome, descrição e categoria seguem diretos).
revoke update on public.projetos from authenticated;
grant update (nome, descricao, categoria) on public.projetos to authenticated;

-- 3. Privacidade dos perfis ---------------------------------------------------------
-- A tela promete mostrar só o primeiro nome. O público passa a ler uma view que
-- entrega só isso (o campo "nome" dela já é o primeiro nome).
create or replace view public.perfis_publicos as
select
  id,
  split_part(trim(nome), ' ', 1) as nome,
  apelido,
  bairro,
  bio,
  institucional_verificado,
  orgao_nome,
  created_at,
  avatar_url,
  capa_url
from public.profiles;

grant select on public.perfis_publicos to anon, authenticated;

drop policy if exists "profiles: leitura publica" on public.profiles;
drop policy if exists "profiles: leitura do proprio perfil" on public.profiles;
create policy "profiles: leitura do proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- 4. Limites de tamanho no servidor ---------------------------------------------------
-- A tela já limita, mas pela API dava para gravar textos gigantes (lixo e custo
-- de armazenamento). NOT VALID: vale para o que entrar daqui para frente, sem
-- reprovar linhas antigas.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_descricao_tamanho') then
    alter table public.posts add constraint posts_descricao_tamanho
      check (char_length(descricao) between 1 and 1000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projetos_nome_tamanho') then
    alter table public.projetos add constraint projetos_nome_tamanho
      check (char_length(nome) between 1 and 160) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projetos_descricao_tamanho') then
    alter table public.projetos add constraint projetos_descricao_tamanho
      check (char_length(descricao) between 1 and 2000) not valid;
  end if;
end $$;

-- 5. Apoios: cada pessoa só lê os próprios -------------------------------------------
-- A policy antiga deixava qualquer um listar "quem apoiou o quê". A contagem
-- pública continua pela view posts_repercussao (roda com os direitos do dono).
drop policy if exists "apoios: leitura publica" on public.post_apoios;
drop policy if exists "apoios: leitura do proprio apoio" on public.post_apoios;
create policy "apoios: leitura do proprio apoio"
  on public.post_apoios for select
  using (auth.uid() = user_id);
