-- Confluência — Tarefa 3.3 (Ana + Guilherme): votação com comprovante e projetos rejeitados privados.
-- Rode DEPOIS das migrations 0001 → 0005. Resolve os itens 1, 2, 3, 4 e 5 de
-- docs/revisao-0003-projetos-votos.md.
--
-- Resumo do que muda:
--  1. Projeto rejeitado deixa de ser público: só o órgão dono lê.
--  2. O resultado agregado (votos_resultado) também respeita isso.
--  3. Ninguém insere em `votos` direto: só pela função votar(), que valida
--     login, status, prazo e GERA o hash no banco (o cliente não escolhe mais).
--  4. meu_comprovante() devolve o comprovante do próprio usuário (nunca a opção),
--     para a tela saber "já votei" mesmo depois de recarregar a página.
--  5. verificar_comprovante() é a parte "auditável": qualquer pessoa confere que
--     um hash existe, sem saber de quem é nem em quem votou.
--  6. O órgão dono só edita as colunas de gestão do projeto (não troca o dono).

-- 1. Projetos rejeitados só para o órgão dono -------------------------------
drop policy if exists "projetos: leitura publica" on projetos;
create policy "projetos: leitura publica, rejeitados so para o orgao"
  on projetos for select
  using (status <> 'rejeitado' or auth.uid() = orgao_id);

-- 2. Resultado agregado: mesma regra de visibilidade -------------------------
-- A view roda com os direitos do dono (por isso consegue ler `votos`), então a
-- regra precisa estar escrita aqui dentro, senão o resultado de um projeto
-- rejeitado vazaria para quem soubesse o id.
create or replace view votos_resultado as
select
  v.projeto_id,
  count(*) filter (where v.opcao = 'favor') as votos_favor,
  count(*) filter (where v.opcao = 'contra') as votos_contra,
  count(*) as total_votos
from votos v
join projetos p on p.id = v.projeto_id
where p.status <> 'rejeitado' or p.orgao_id = auth.uid()
group by v.projeto_id;

grant select on votos_resultado to anon, authenticated;

-- 3. Votar só pela função ------------------------------------------------------
drop policy if exists "votos: inserir exige login e um voto por projeto" on votos;
revoke insert, update, delete on votos from anon, authenticated;

create or replace function public.votar(p_projeto_id uuid, p_opcao text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_projeto projetos%rowtype;
  v_hash text;
begin
  if v_user is null then
    raise exception 'Entre com sua conta para votar.' using errcode = '28000';
  end if;

  if p_opcao is null or p_opcao not in ('favor', 'contra') then
    raise exception 'Opção de voto inválida.' using errcode = '22023';
  end if;

  select * into v_projeto from projetos where id = p_projeto_id;

  if not found or v_projeto.status <> 'em_consulta' then
    raise exception 'Este projeto não está em consulta pública.' using errcode = 'CF001';
  end if;

  if v_projeto.consulta_fim is not null and v_projeto.consulta_fim < now() then
    raise exception 'A consulta pública deste projeto já foi encerrada.' using errcode = 'CF002';
  end if;

  -- Hash gerado aqui, no banco: aleatório + dados do voto, sem guardar nada que
  -- permita ligar o comprovante à opção escolhida.
  v_hash := encode(
    digest(
      gen_random_uuid()::text || p_projeto_id::text || v_user::text || clock_timestamp()::text,
      'sha256'
    ),
    'hex'
  );

  -- Voto duplicado: a UNIQUE (projeto_id, user_id) da 0003 faz este insert falhar
  -- com 23505 (unique_violation). O app trata esse código como "você já votou".
  insert into votos (projeto_id, user_id, opcao, hash_comprovante)
  values (p_projeto_id, v_user, p_opcao, v_hash);

  return v_hash;
end;
$$;

revoke all on function public.votar(uuid, text) from public, anon;
grant execute on function public.votar(uuid, text) to authenticated;

-- 4. "Já votei?" + comprovante do próprio usuário --------------------------------
-- Devolve só o hash (null se ainda não votou). A opção NUNCA sai daqui.
create or replace function public.meu_comprovante(p_projeto_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select hash_comprovante
  from votos
  where projeto_id = p_projeto_id
    and user_id = auth.uid();
$$;

revoke all on function public.meu_comprovante(uuid) from public, anon;
grant execute on function public.meu_comprovante(uuid) to authenticated;

-- 5. Auditoria: este comprovante existe? -----------------------------------------
-- Aceita o hash completo (64 caracteres) ou o começo dele (os 16 que a tela
-- mostra), desde que tenha pelo menos 16. Devolve só projeto e data/hora.
create or replace function public.verificar_comprovante(p_hash text)
returns table (projeto_id uuid, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select v.projeto_id, v.created_at
  from votos v
  join projetos p on p.id = v.projeto_id
  where length(trim(p_hash)) >= 16
    and v.hash_comprovante like lower(trim(p_hash)) || '%'
    and (p.status <> 'rejeitado' or p.orgao_id = auth.uid())
  limit 1;
$$;

grant execute on function public.verificar_comprovante(text) to anon, authenticated;

-- 6. O órgão dono só edita as colunas de gestão ------------------------------------
-- Sem isso a policy de update (só confere a LINHA) deixaria o dono trocar
-- orgao_id, origem_post_id ou created_at. `with check` impede transferir o projeto.
drop policy if exists "projetos: so o orgao dono edita" on projetos;
create policy "projetos: so o orgao dono edita"
  on projetos for update
  using (auth.uid() = orgao_id)
  with check (auth.uid() = orgao_id);

revoke update on projetos from authenticated;
grant update (nome, descricao, categoria, status, timeline, consulta_fim) on projetos to authenticated;
