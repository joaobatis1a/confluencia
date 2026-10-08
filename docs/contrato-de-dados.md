# Contrato de dados — Confluência

Documento vivo. Se um campo mudar, atualize aqui, em `src/types/database.ts` e nas migrations em `supabase/migrations/`, nessa ordem. Mudou um nome de campo e esqueceu de atualizar os três? É a causa nº 1 de bug bobo entre frontend e backend.

## `posts` (módulo Feed — dono: João / Guilherme)

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | uuid | gerado automaticamente | |
| `user_id` | uuid | sim | quem postou, vem do usuário logado |
| `categoria` | enum | sim | mobilidade, iluminacao, seguranca, saneamento, pracas_lazer, saude, educacao, outros |
| `bairro` | texto | sim | |
| `descricao` | texto | sim | |
| `foto_url` | texto | não | upload fica para próxima fase |
| `latitude` | número decimal | sim | validado como dentro da Região Metropolitana do Recife |
| `longitude` | número decimal | sim | idem |
| `repercussao` | número inteiro | calculado | recorrência + engajamento (Guilherme, Tarefa 2.3) |
| `created_at` | data/hora | automático | |

## `projetos` (módulo Projetos — dono: Ana / Guilherme)

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | uuid | gerado automaticamente | |
| `orgao_id` | uuid | sim | precisa ser conta institucional verificada |
| `nome` | texto | sim | |
| `descricao` | texto | sim | |
| `categoria` | enum | sim | mesma lista de `posts` |
| `status` | enum | sim | proposto, em_consulta, aprovado, rejeitado, em_execucao, concluido |
| `origem_post_id` | uuid | não | liga a um post do Feed, se houver |
| `timeline` | jsonb (lista de marcos) | sim (pode ser vazio) | cada marco: `{ nome, data_prevista, data_real }` |
| `consulta_fim` | data/hora | não | prazo da consulta pública |
| `created_at` | data/hora | automático | |

## `votos` (módulo Projetos — dono: Guilherme)

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | uuid | gerado automaticamente | |
| `projeto_id` | uuid | sim | |
| `user_id` | uuid | sim | usado só para bloquear voto duplicado — nunca exposto publicamente ligado à opção |
| `opcao` | texto (`favor`/`contra`) | sim | nunca lido linha a linha por consulta pública |
| `hash_comprovante` | texto | sim | mostrado ao usuário como prova de que votou |
| `created_at` | data/hora | automático | |

Resultado agregado disponível via view `votos_resultado` (ver `supabase/migrations/0003_projetos_votos.sql`) — nunca consulte `votos` diretamente para mostrar resultado.

## `profiles` (dono: Guilherme)

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | uuid | = auth.users.id | criado automaticamente no cadastro |
| `nome` | texto | não | |
| `institucional_verificado` | booleano | sim (default false) | aprovação manual pelo Guilherme no painel do Supabase |
| `orgao_nome` | texto | não | |
