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
| `0010_seguranca_desempenho.sql` | Remove `registrar_voto`; `comprovantes_publicos` sem rejeitados; resposta oficial só com projeto do próprio órgão; `search_path` em `handle_new_user`; índices | Guilherme 4.2/4.3 |
| `0011_origem_e_comprovantes.sql` | Relato apagado não trava mais por causa do projeto (`on delete set null` em `origem_post_id`); índices para "relato virou projeto?" e para a listagem; `verificar_comprovante` usando índice | Ana 4.1/4.2 |
| `0012_so_no_recife.sql` | Tabela `limite_cidade` (contorno do município), função `dentro_do_recife` e gatilho que recusa relato com ponto fora da cidade (`CF010`) | João (Semana 5) |
| `0013_gestor_nao_vota.sql` | `votar` passa a recusar conta de órgão verificado (`CF003`); o resto da função é igual à 0007 | João (Semana 5) |
| `0014_bairros_oficiais.sql` | Tabela `bairros_recife` (94 bairros, 6 RPAs), funções `chave_bairro` e `bairro_oficial`, gatilhos que padronizam o nome e recusam bairro fora da lista em `posts` e `profiles` (`CF011`) | João (Semana 5) |
| `0015_fotos.sql` | Colunas `avatar_url` e `capa_url` em `profiles`, checagem de que a foto é do nosso bucket, bucket `fotos` no Storage com 3 políticas | João (Semana 5) |

Dados de exemplo (opcionais, depois das migrations): `seed_repercussao.sql`, `seed_projetos.sql`, `seed-social-demo.sql` e `seed-teste-2.2.sql`. Tudo que é de teste tem o prefixo `[SEED]` no nome ou na descrição.

**Script da Semana 5:** `supabase/semana5_limpeza_e_projetos.sql`, rodado uma vez no SQL Editor depois da 0014. Não é migration: o **Passo 1** só lista o que sai (relatos e projetos `[SEED]`, lixo digitado em testes, conta de QA, bairros sem acento) e o **Passo 2** apaga e grava os seis projetos da vitrine (`p1` a `p6`, ids fixos, dono `gestor.demo`). Pode rodar de novo: atualiza em vez de duplicar. Apaga dados; confira o Passo 1 antes e, se possível, faça um `pg_dump` (ver [`supabase/README.md`](../supabase/README.md#backup)).

## O que está aplicado em produção

Conferido em 29/10/2026 consultando a API do Supabase com a chave pública:

| Migration | Situação |
|---|---|
| 0001 a 0010 | Aplicadas em 30/10/2026, na ordem de [`supabase/README.md`](../supabase/README.md#banco-que-já-tem-0001-a-0006-produção-em-2910), com `seed-social-demo.sql` e `seed_projetos.sql` |
| 0011 a 0015 | **Falta aplicar** (0011 da Semana 4 da Ana; 0012 a 0015 da Semana 5). Ordem: 0011 → 0015, antes `npm run test:rls`. Todas podem rodar mais de uma vez |
| `semana5_limpeza_e_projetos.sql` | **Falta rodar**, depois da 0014 (Guilherme, com o João conferindo o Passo 1) |
| Auth | Cadastro fechado (`disable_signup: true`); as duas contas demo entram |

> Atualize esta tabela com a data assim que o Guilherme aplicar: a coluna "Situação" só vale para o que foi conferido no banco, não para o que está no repositório.

Conferido depois de aplicar a 0010 (30/10): o Feed lê 14 relatos pela `posts_repercussao` (2 com resposta oficial), o gestor demo é verificado e tem os 3 projetos `[SEED]` no painel, a Av. Boa Viagem está em consulta até 20/12, e o `npm run test:rls` dá 24 bloqueados e 0 furos.

**Depois do script da Semana 5** o estado esperado é outro: sem relatos nem projetos `[SEED]`, sem lixo de teste, bairros com o nome oficial e seis projetos do gestor demo no banco (`p1` a `p6`). A consulta aberta passa a ser a **Requalificação da Av. Norte** (`p1`), até 20/12/2026, e a Av. Boa Viagem sai de cena.

**Ensaio local (PGlite), 09/11/2026:** 0001 a 0015 aplicam em ordem e reaplicam sem erro. O bucket da 0015 não é exercitado, porque o PGlite não tem o schema `storage` (a migration avisa e pula essa parte). Regras conferidas:

| Regra | Resultado |
|---|---|
| `bairros_recife` | 94 bairros |
| Relato com bairro `varzea` dentro do Recife | Grava como `Várzea` |
| Relato com ponto no mar (-8, -34) | Recusado, `CF010` |
| Relato com bairro `Olinda` | Recusado, `CF011` |
| Relato com `foto_url` fora do bucket | Recusado (`posts_foto_do_bucket`, `23514`) |
| Conta de órgão verificado chama `votar` | Recusado, `CF003` |
| Cidadã vota; vota de novo | Hash de 64 caracteres; segunda vez `23505` |

O script de cenários `supabase/testes/testar-migrations.mjs` (Semana 4) continua valendo até a 0011, mas usa um ponto fora do Recife nos relatos de teste e precisa de coordenadas da cidade para rodar com a 0012 ou mais.

O app foi escrito para não quebrar antes disso: sem a 0008 o formulário publica sem o campo `anonimo` e o perfil cai para o básico; sem a 0015 o envio de foto avisa que falta a migration e o resto funciona.

## Tabelas

| Tabela | Guarda | Chave | Observação |
|---|---|---|---|
| `profiles` | Nome, apelido, bairro, bio, `avatar_url`, `capa_url`, `institucional_verificado`, `orgao_nome` | `id` = `auth.users.id` | Criada sozinha no cadastro (gatilho `on_auth_user_created`). Bairro, se vier, tem de ser da lista oficial (0014); as duas fotos têm de ser do bucket `fotos` (0015) |
| `posts` | Relato: categoria, bairro, descrição, `foto_url`, latitude, longitude, `anonimo` | `id` | Coluna `repercussao` é legada (sempre 0); o valor real vem da view. O ponto tem de estar no Recife (0012), o bairro na lista oficial (0014) e a foto, se houver, no bucket `fotos` (0015) |
| `post_apoios` | Um apoio por pessoa por relato | (`post_id`, `user_id`) | |
| `comentarios` | Comentário de 1 a 500 caracteres | `id` | |
| `respostas_oficiais` | Resposta do órgão com status (`recebido`, `em_analise`, `virou_projeto`, `resolvido`, `nao_procede`) e projeto opcional | `id` | |
| `bairros_seguidos` | Bairros que a pessoa segue | (`user_id`, `bairro`) | |
| `notificacoes` | Aviso para a pessoa: `resposta_oficial`, `comentario`, `apoio`, `novo_relato_bairro` | `id` | Criadas por gatilho; o usuário só marca `lida` |
| `projetos` | Nome, descrição, categoria, status, `origem_post_id`, `timeline` (jsonb), `consulta_fim` | `id` | `orgao_id` = conta institucional dona |
| `votos` | Projeto, usuário, opção (`favor`/`contra`), `hash_comprovante` | `id` | `UNIQUE (projeto_id, user_id)`; ninguém lê esta tabela |
| `limite_cidade` | Contorno do município do Recife (`aneis`, jsonb) | `id` (sempre 1) | 0012. Sem política de leitura: só as funções do banco usam. Mesmo contorno de `src/lib/recife.ts` (OpenStreetMap, relação 303585, ODbL) |
| `bairros_recife` | Os 94 bairros oficiais e a RPA de cada um (1 a 6) | `nome` | 0014. Leitura pública. Mesma lista de `src/lib/bairros.ts` |

## Views

| View | Para quê |
|---|---|
| `posts_repercussao` | Leitura do Feed. Junta o relato com `recorrencia` (relatos da mesma categoria e bairro em 30 dias), `interacoes` (apoios), `repercussao` (soma), `comentarios` e `status_oficial`. Devolve `user_id` nulo em relato anônimo, a não ser para o próprio autor |
| `votos_resultado` | Placar agregado por projeto (`votos_favor`, `votos_contra`, `total_votos`). Depois da 0007, esconde projetos rejeitados de quem não é o órgão dono |
| `comprovantes_publicos` | Lista de hashes por projeto, em ordem de hash, sem usuário, opção ou data, para auditoria pública. Depois da 0010, sem projetos rejeitados (menos para o órgão dono) |

## Funções

| Função | Quem chama | O que faz |
|---|---|---|
| `votar(projeto, opcao)` | App (cédula) | Confere login, opção, status `em_consulta` e prazo; grava o voto; gera e devolve o hash SHA-256 no banco. Desde a 0013 recusa conta de órgão verificado. Erros: `28000` sem login, `CF003` conta de órgão, `22023` opção inválida, `CF001` fora de consulta, `CF002` prazo encerrado, `23505` já votou |
| `meu_comprovante(projeto)` | App | Hash do próprio voto, ou nulo. Nunca a opção |
| `verificar_comprovante(hash)` | App (qualquer pessoa) | Aceita 16 a 64 caracteres hexadecimais e devolve projeto e data, se existir |
| `nome_publico(id)` | Gatilhos de notificação | Nome do órgão, apelido ou nome da pessoa |
| `posts_forcar_anonimo()` | Gatilho em `posts` | Em Segurança, `anonimo` vira `true` sempre |
| `dentro_do_recife(lat, lng)` | Gatilho de `posts` (e qualquer um, é pública) | Diz se o ponto está dentro de algum anel de `limite_cidade` (algoritmo do raio, o mesmo do app) |
| `posts_so_no_recife()` | Gatilho em `posts` (insert, ou update de latitude/longitude) | Recusa ponto fora da cidade. Erro `CF010` |
| `chave_bairro(texto)` | Interna | Texto sem acento, sem caixa e sem pontuação, para comparar nomes ("Pau-Ferro" = "pau ferro") |
| `bairro_oficial(texto)` | Gatilhos e script da Semana 5 | Nome oficial do bairro (`varzea` → `Várzea`) ou nulo se não existe |
| `posts_bairro_oficial()` | Gatilho em `posts` | Bairro obrigatório e da lista; grava o nome oficial. Erro `CF011` |
| `profiles_bairro_oficial()` | Gatilho em `profiles` | Bairro opcional; se vier, tem de ser da lista. Erro `CF011` |
| `url_de_foto_valida(url)` | Checagens de `profiles` e `posts` | Nulo ou endereço do bucket público `fotos` do Supabase; recusa link de fora |

## Regras de acesso (RLS) em resumo

| Quem | Pode | Não pode |
|---|---|---|
| Visitante | Ler relatos, apoios, comentários, respostas, projetos públicos, placar, perfis | Escrever qualquer coisa |
| Cidadão logado | Relatar (ponto no Recife, bairro da lista), apagar o **próprio relato**, apoiar e desapoiar, comentar e apagar o próprio comentário, seguir bairros, votar uma vez por projeto, editar nome, apelido, bairro, bio, foto de perfil e capa, enviar foto para a própria pasta do bucket | Ler votos, se marcar como institucional, criar projeto, responder oficialmente, ver o autor de relato anônimo, relatar fora do Recife, usar bairro fora da lista, mandar foto para a pasta de outra pessoa |
| Órgão verificado | Tudo do cidadão, menos votar: criar projeto, editar status, linha do tempo e prazo dos próprios projetos, ver os próprios rejeitados, publicar resposta oficial, acompanhar o placar ao vivo | **Votar** (0013, `CF003`, nem no próprio projeto), trocar o dono de um projeto, editar projeto de outro órgão, ligar resposta oficial a projeto de outro órgão |
| Administrador | Marcar `institucional_verificado` pelo painel do Supabase | |

## Storage (fotos)

Criado pela 0015, só no Supabase. Bucket `fotos`: público, até 5 MB por arquivo, apenas `image/jpeg`, `image/png` e `image/webp`. Cada pessoa grava no caminho `<id da conta>/<tipo>-<uuid>.jpg` (tipo: `avatar`, `capa` ou `relato`). O app reduz a foto no navegador (512 px no avatar, 1800 na capa, 1600 no relato) e converte para JPEG antes de enviar.

| Política | Quem | Regra |
|---|---|---|
| `fotos: qualquer um ve` | Todos | Leitura de qualquer arquivo do bucket |
| `fotos: envia na propria pasta` | Logado | Insert só se a primeira pasta do caminho é o próprio `auth.uid()` |
| `fotos: apaga da propria pasta` | Logado | Delete só na própria pasta |

Conferir em **Storage** do painel: o bucket existe com as três políticas. As fotos de região do card (uma por RPA) **não** ficam no bucket: vêm da Wikimedia Commons, em `src/lib/fotos.ts`, com crédito exibido e licença livre.

## Índices

Além das chaves e das `UNIQUE`: `posts (bairro, categoria, created_at)` para a recorrência da `posts_repercussao` (0010; substitui o índice só por bairro), `posts (categoria)`, `posts (created_at desc)`, `projetos (status)`, `projetos (orgao_id, created_at desc)` para o painel do gestor, `respostas_oficiais (post_id, created_at)` e `(orgao_id, created_at desc)`, `comentarios (post_id, created_at)` e `notificacoes (user_id, created_at desc)`. Da 0011: `projetos (origem_post_id)` parcial, `projetos (created_at desc)`, `votos (left(hash_comprovante, 16))` e `respostas_oficiais (projeto_id)` parcial. `votos` não precisa de índice por `projeto_id`: a `UNIQUE (projeto_id, user_id)` já começa por ele.

## Pontos em aberto

- Resolvidos na 0010: duas funções de voto (ficou só `votar`) e hashes de projetos rejeitados em `comprovantes_publicos`.
- `profiles` é legível por todos, inclusive o `nome` completo. Num relato anônimo o autor não aparece, mas em relato comum o nome real é público junto com o apelido.
- Quem tem acesso administrativo ao banco consegue cruzar `user_id` e `opcao` em `votos`. Anonimato forte fica para a próxima fase (ver [Votação](votacao.md)).
- A recorrência conta 30 dias a partir de hoje, não da data do relato.
- Resolvidos na 0011 a 0015: relato que virou projeto agora pode ser apagado (0011), relato fora do Recife e bairro fora da lista são recusados no banco (0012, 0014), órgão não vota (0013) e foto só aceita do nosso bucket (0015).
- As checagens `posts_foto_do_bucket` e `profiles_fotos_do_bucket` foram criadas `NOT VALID`: valem para insert e update, mas não olham linhas antigas. Um relato antigo com foto de fora continua lá até alguém editá-lo.
- O contorno do Recife existe em dois lugares (`src/lib/recife.ts` e `limite_cidade`) e a lista de bairros também (`src/lib/bairros.ts` e `bairros_recife`). Mudar um sem o outro faz o app aceitar o que o banco recusa.

Testes de burla: `npm run test:rls` (ver [`supabase/README.md`](../supabase/README.md#testar-o-rls)).
