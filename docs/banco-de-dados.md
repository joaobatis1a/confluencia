# Banco de dados

Postgres no Supabase. Todo o esquema está em `supabase/migrations/`, em arquivos numerados que devem ser aplicados **em ordem**, pelo SQL Editor do painel (passo a passo em `supabase/README.md`). O contrato campo a campo, do ponto de vista do front, está em [Contrato de dados](contrato-de-dados.md).

## As migrations

| Arquivo | O que faz | Autoria |
|---|---|---|
| `0001_posts.sql` | Enum `categoria_post` (8 categorias) e tabela `posts` | Rascunho João (PR #1); revisão e aplicação Guilherme 1.1 |
| `0002_profiles.sql` | Tabela `profiles` e gatilho que cria o perfil no cadastro | Rascunho João (PR #1); Guilherme 1.4 |
| `0003_projetos_votos.sql` | Enum `status_projeto`, tabelas `projetos` e `votos`, view `votos_resultado` | Rascunho João (PR #1); revisão Ana 2.2 (PR #7) e Guilherme |
| `0004_rls_policies.sql` | Regras de acesso de posts, profiles, projetos e votos | Rascunho João (PR #1); Guilherme 1.3 |
| `0005_repercussao.sql` | Tabela `post_apoios` e view `posts_repercussao` | Guilherme 2.3 |
| `0006_votacao.sql` | Fecha o insert direto em `votos`; funções `registrar_voto` e `meu_comprovante`; view `comprovantes_publicos` | Guilherme 3.1 |
| `0007_votacao_projetos.sql` | Função `votar` (a que o app usa), `verificar_comprovante`, projeto rejeitado privado, update só nas colunas de gestão | Ana 3.3 |
| `0008_rede_social.sql` | Perfil público, relato anônimo, comentários, respostas oficiais, bairros seguidos, notificações; nova `posts_repercussao` | João (repaginada) |
| `0009_fechar_autor.sql` | Fecha a coluna do autor na tabela `posts` (o anonimato passa a valer no banco) | João (repaginada) |

Dados de exemplo (opcionais, depois das migrations): `seed_repercussao.sql`, `seed_projetos.sql`, `seed-social-demo.sql` e `seed-teste-2.2.sql`. Tudo que é de teste tem o prefixo `[SEED]` no nome ou na descrição.

## O que está aplicado em produção

Conferido em 29/10/2026 consultando a API do Supabase com a chave pública:

| Migration | Situação |
|---|---|
| 0001 a 0006 | Aplicadas (`comprovantes_publicos` e `registrar_voto` existem) |
| 0007 | **Falta aplicar.** Sem ela, a função `votar` não existe e votar em projeto do banco dá erro |
| 0008 | **Falta aplicar.** Comentários, respostas oficiais, bairros seguidos, notificações e relato anônimo não funcionam no banco real |
| 0009 | **Falta aplicar,** e só depois da 0008 |

Aplicar 0007, 0008, os seeds e por fim a 0009 é a Tarefa 4.1 do Guilherme na Semana 4. O app foi escrito para não quebrar antes disso: sem a 0008 o formulário publica sem o campo `anonimo` e o perfil cai para o básico.

## Tabelas

| Tabela | Guarda | Chave | Observação |
|---|---|---|---|
| `profiles` | Nome, apelido, bairro, bio, `institucional_verificado`, `orgao_nome` | `id` = `auth.users.id` | Criada sozinha no cadastro (gatilho `on_auth_user_created`) |
| `posts` | Relato: categoria, bairro, descrição, latitude, longitude, `anonimo` | `id` | Coluna `repercussao` é legada (sempre 0); o valor real vem da view |
| `post_apoios` | Um apoio por pessoa por relato | (`post_id`, `user_id`) | |
| `comentarios` | Comentário de 1 a 500 caracteres | `id` | |
| `respostas_oficiais` | Resposta do órgão com status (`recebido`, `em_analise`, `virou_projeto`, `resolvido`, `nao_procede`) e projeto opcional | `id` | |
| `bairros_seguidos` | Bairros que a pessoa segue | (`user_id`, `bairro`) | |
| `notificacoes` | Aviso para a pessoa: `resposta_oficial`, `comentario`, `apoio`, `novo_relato_bairro` | `id` | Criadas por gatilho; o usuário só marca `lida` |
| `projetos` | Nome, descrição, categoria, status, `origem_post_id`, `timeline` (jsonb), `consulta_fim` | `id` | `orgao_id` = conta institucional dona |
| `votos` | Projeto, usuário, opção (`favor`/`contra`), `hash_comprovante` | `id` | `UNIQUE (projeto_id, user_id)`; ninguém lê esta tabela |

## Views

| View | Para quê |
|---|---|
| `posts_repercussao` | Leitura do Feed. Junta o relato com `recorrencia` (relatos da mesma categoria e bairro em 30 dias), `interacoes` (apoios), `repercussao` (soma), `comentarios` e `status_oficial`. Devolve `user_id` nulo em relato anônimo, a não ser para o próprio autor |
| `votos_resultado` | Placar agregado por projeto (`votos_favor`, `votos_contra`, `total_votos`). Depois da 0007, esconde projetos rejeitados de quem não é o órgão dono |
| `comprovantes_publicos` | Lista de hashes por projeto, sem usuário, opção ou data, para auditoria pública |

## Funções

| Função | Quem chama | O que faz |
|---|---|---|
| `votar(projeto, opcao)` | App (cédula) | Confere login, opção, status `em_consulta` e prazo; grava o voto; gera e devolve o hash SHA-256 no banco. Erros: `28000` sem login, `CF001` fora de consulta, `CF002` prazo encerrado, `23505` já votou |
| `registrar_voto(projeto, opcao)` | Nenhuma tela (versão do Guilherme) | Mesma ideia, com erros em texto (`ja_votou`, `votacao_encerrada`...). Uma das duas deve ser removida na revisão de segurança |
| `meu_comprovante(projeto)` | App | Hash do próprio voto, ou nulo. Nunca a opção |
| `verificar_comprovante(hash)` | App (qualquer pessoa) | Aceita 16 a 64 caracteres hexadecimais e devolve projeto e data, se existir |
| `nome_publico(id)` | Gatilhos de notificação | Nome do órgão, apelido ou nome da pessoa |
| `posts_forcar_anonimo()` | Gatilho em `posts` | Em Segurança, `anonimo` vira `true` sempre |

## Regras de acesso (RLS) em resumo

| Quem | Pode | Não pode |
|---|---|---|
| Visitante | Ler relatos, apoios, comentários, respostas, projetos públicos, placar, perfis | Escrever qualquer coisa |
| Cidadão logado | Relatar, apoiar e desapoiar, comentar e apagar o próprio comentário, seguir bairros, votar uma vez por projeto, editar nome, apelido, bairro e bio | Ler votos, se marcar como institucional, criar projeto, responder oficialmente, ver o autor de relato anônimo |
| Órgão verificado | Tudo do cidadão + criar projeto, editar status, linha do tempo e prazo dos próprios projetos, ver os próprios rejeitados, publicar resposta oficial | Trocar o dono de um projeto, editar projeto de outro órgão |
| Administrador | Marcar `institucional_verificado` pelo painel do Supabase | |

## Pontos em aberto

- Duas funções de voto convivem (`registrar_voto` e `votar`). O app usa `votar`.
- `comprovantes_publicos` lista também hashes de projetos rejeitados, que a 0007 tornou privados.
- Quem tem acesso administrativo ao banco consegue cruzar `user_id` e `opcao` em `votos`. Anonimato forte fica para a próxima fase (ver [Votação](votacao.md)).
- A recorrência conta 30 dias a partir de hoje, não da data do relato.

Os três primeiros estão na Tarefa 4.3 do Guilherme (revisão de segurança).
