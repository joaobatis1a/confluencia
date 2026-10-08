-- Confluência — Tarefa 1.3 (Guilherme): regras de acesso (RLS)
-- Resumo das regras (rascunho em texto, igual ao guia individual):
--  - qualquer um autenticado pode ler posts/projetos
--  - só o dono pode editar/apagar o próprio post
--  - só conta institucional verificada pode criar projeto
--  - um usuário só pode votar uma vez por projeto (garantido pelo UNIQUE da 0003)
--  - a opção votada nunca é lida individualmente, só agregada (view votos_resultado)

-- posts -----------------------------------------------------------------
create policy "posts: leitura publica"
  on posts for select
  using (true);

create policy "posts: criar precisa estar logado"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "posts: so o dono edita"
  on posts for update
  using (auth.uid() = user_id);

create policy "posts: so o dono apaga"
  on posts for delete
  using (auth.uid() = user_id);

-- profiles ----------------------------------------------------------------
create policy "profiles: leitura publica"
  on profiles for select
  using (true);

create policy "profiles: so o dono edita o proprio perfil"
  on profiles for update
  using (auth.uid() = id);

-- A policy acima restringe a LINHA (só a própria), mas não a COLUNA — sem isso,
-- qualquer usuário logado poderia rodar
--   update profiles set institucional_verificado = true where id = auth.uid()
-- e se autopromover a conta institucional, furando a aprovação manual do
-- Guilherme. Revoga o UPDATE genérico e libera só a coluna que o usuário deve
-- poder editar; institucional_verificado/orgao_nome só mudam via painel do
-- Supabase (service role, que ignora RLS e esses grants).
revoke update on profiles from authenticated;
grant update (nome) on profiles to authenticated;

-- projetos ------------------------------------------------------------------
create policy "projetos: leitura publica"
  on projetos for select
  using (true);

create policy "projetos: so institucional verificado cria"
  on projetos for insert
  with check (
    auth.uid() = orgao_id
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.institucional_verificado = true
    )
  );

create policy "projetos: so o orgao dono edita"
  on projetos for update
  using (auth.uid() = orgao_id);

-- votos -----------------------------------------------------------------
-- Ninguem le a tabela votos diretamente (nem o proprio voto) — a app usa
-- a view votos_resultado para numeros agregados. Isso evita qualquer
-- caminho de expor "quem votou em que" por engano.
create policy "votos: inserir exige login e um voto por projeto"
  on votos for insert
  with check (auth.uid() = user_id);

-- Nenhuma policy de select em votos = ninguem le linha a linha, nem o dono.
-- A view votos_resultado (select sobre agregado) e publica por definicao de view.
grant select on votos_resultado to anon, authenticated;
