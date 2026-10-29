-- Confluência — Tarefa 3.1 (Guilherme): votação secreta e auditável
-- Único caminho de voto: função registrar_voto (valida e gera o hash no servidor).

-- 1) Fecha o insert direto: só a função grava votos.
drop policy if exists "votos: inserir exige login e um voto por projeto" on votos;
revoke insert, update, delete on votos from anon, authenticated;

-- 2) Registrar voto
create or replace function public.registrar_voto(p_projeto_id uuid, p_opcao text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_status status_projeto;
  v_fim    timestamptz;
  v_id     uuid := gen_random_uuid();
  v_hash   text;
begin
  if v_user is null then
    raise exception 'login_necessario';
  end if;
  if p_opcao not in ('favor', 'contra') then
    raise exception 'opcao_invalida';
  end if;

  select status, consulta_fim into v_status, v_fim
  from projetos where id = p_projeto_id;

  if not found then
    raise exception 'projeto_inexistente';
  end if;
  if v_status <> 'em_consulta' or (v_fim is not null and v_fim <= now()) then
    raise exception 'votacao_encerrada';
  end if;

  -- Hash do comprovante: id do voto + projeto + instante + sal aleatório.
  -- O sal impede reconstruir o hash a partir da opção votada.
  v_hash := encode(
    sha256(convert_to(
      v_id::text || '|' || p_projeto_id::text || '|' ||
      clock_timestamp()::text || '|' || gen_random_uuid()::text,
      'UTF8')),
    'hex');

  insert into votos (id, projeto_id, user_id, opcao, hash_comprovante)
  values (v_id, p_projeto_id, v_user, p_opcao, v_hash);

  return v_hash;
exception
  when unique_violation then
    raise exception 'ja_votou';
end;
$$;

revoke all on function public.registrar_voto(uuid, text) from public, anon;
grant execute on function public.registrar_voto(uuid, text) to authenticated;

-- 3) O usuário consulta o PRÓPRIO comprovante (nunca a opção)
create or replace function public.meu_comprovante(p_projeto_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select hash_comprovante from votos
  where projeto_id = p_projeto_id and user_id = auth.uid();
$$;

revoke all on function public.meu_comprovante(uuid) from public, anon;
grant execute on function public.meu_comprovante(uuid) to authenticated;

-- 4) Auditoria pública: hashes por projeto, sem usuário, sem opção, sem data.
-- Sem security_invoker de propósito: votos não tem policy de select.
create or replace view public.comprovantes_publicos as
select projeto_id, hash_comprovante
from votos;

grant select on public.comprovantes_publicos to anon, authenticated;