-- Confluência — 0009 (João): torna o anonimato real.
-- RODAR SÓ JUNTO COM O MERGE DA BRANCH `repaginada` NA `main`: o front antigo
-- lê a tabela `posts` direto (incluindo user_id) e pararia de carregar.
--
-- Sem isto, qualquer um leria `posts.user_id` pela API e descobriria o autor
-- de um relato anônimo. Depois disto o público lê `posts` sem a coluna do
-- autor; o autor só aparece pela view `posts_repercussao` (0008), que o
-- esconde quando o relato é anônimo — exceto para o próprio autor.

revoke select on posts from anon, authenticated;
grant select (id, categoria, bairro, descricao, foto_url, latitude, longitude, repercussao, created_at, anonimo)
  on posts to anon, authenticated;
