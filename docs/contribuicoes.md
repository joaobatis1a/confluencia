# Contribuições por integrante

Escopo combinado no início do projeto (guias individuais) e o que cada pessoa entregou, com evidência no repositório. Números de 29/10/2026.

## Divisão combinada

| Pessoa | Frente | Responsável por |
|---|---|---|
| João Batista (líder) | Frontend do Feed + geolocalização | Telas do Feed, mapa, coordenadas, simulação visual, clusters, coordenação, revisão dos PRs |
| Ana Beatriz | Frontend de Projetos + apoio ao banco | Telas de Projetos, painel do gestor, formulário de projeto, tabelas de projetos e votos, consultas de votação |
| Guilherme Araújo | Backend, integração e deploy | Supabase, autenticação, RLS, contrato de dados, repercussão, regras de votação, verificação institucional, deploy |

## O que cada um entregou

### João Batista

| Entrega | Evidência |
|---|---|
| Scaffold (Vite, React, TypeScript, Tailwind v4 com os tokens do design system) | Commit `dc63076` |
| Adiantamento das Semanas 1 e 2: Feed, Projetos inicial, telas de login, rascunho das migrations 0001 a 0004, README, LICENSE, deploy | [PR #1](https://github.com/joaobatis1a/confluencia/pull/1) |
| Feed, detalhe e "Meus relatos" ligados ao Supabase real (Tarefas 2.4 a 2.6) | [PR #4](https://github.com/joaobatis1a/confluencia/pull/4) |
| Apoio na votação: voto real com hash e barra de resultado (Tarefa 3.1) | [PR #5](https://github.com/joaobatis1a/confluencia/pull/5) |
| Clusters no mapa Leaflet (Tarefa 4.2, chamada de 5.2 no cronograma) | [PR #8](https://github.com/joaobatis1a/confluencia/pull/8) |
| Repaginada: landing, mapa 3D do Feed, tela de Entrar com contas demo, perfil único, camada social (migrations 0008 e 0009), redesenho de Projetos, otimização de desempenho, simulação visual (Tarefa 4.1) | 25 commits integrados no [PR #10](https://github.com/joaobatis1a/confluencia/pull/10) |
| Integração da Semana 3 com a repaginada (conflitos, renumeração das migrations, telas novas lendo pelo `api.ts`) | [PR #10](https://github.com/joaobatis1a/confluencia/pull/10) |
| Cronograma, guias semanais, documentação | [PR #2](https://github.com/joaobatis1a/confluencia/pull/2), `docs/` |

### Ana Beatriz

| Entrega | Evidência |
|---|---|
| Wireframes de Projetos e Perfil (Tarefa 1.1) | `docs/wireframes-projetos-perfil.md`, commit `8ad540a` |
| Ajuste dos tokens do design system v2.1 | Commit `ec9a610` |
| Telas de Projetos, `StatusDestaque` com trilho de etapas, votação na consulta, formulário de criar projeto, painel com contadores, página de perfil, rotas na barra (Tarefas 2.1, 2.3, 2.4) | [PR #3](https://github.com/joaobatis1a/confluencia/pull/3), 8 commits |
| Modo demonstração sem Supabase, revisão da 0003 e seed de teste (Tarefas 2.2 e 2.3). Enviados em arquivo e commitados pelo João | [PR #7](https://github.com/joaobatis1a/confluencia/pull/7) |
| Semana 3 completa: `api.ts` (todas as consultas, real e mock), `timeline.ts` (atraso por marco), painel do gestor com rejeitados e "publicar atualização", tela de projeto com voto confirmado e "já votou", verificação de comprovante, migration `0007_votacao_projetos.sql` (Tarefas 3.1 a 3.3) | [PR #9](https://github.com/joaobatis1a/confluencia/pull/9), commit `cdfbaea` |

Na revisão da Semana 3 foi encontrado um curinga do `LIKE` em `verificar_comprovante`; o ajuste (aceitar só hexadecimal) entrou na integração do PR #10.

### Guilherme Araújo

| Entrega | Evidência |
|---|---|
| Projeto Supabase criado, autenticação ativa, migrations 0001 a 0006 aplicadas (Tarefas 1.1, 1.3, 1.4) | Banco em produção (ver [Banco de dados](banco-de-dados.md#o-que-esta-aplicado-em-producao)) |
| Repercussão: tabela `post_apoios`, view `posts_repercussao`, seed com relatos de teste, contrato atualizado (Tarefa 2.3) | [PR #6](https://github.com/joaobatis1a/confluencia/pull/6), commit `da06e9b` |
| Votação com hash gerado no servidor (`registrar_voto`), `meu_comprovante`, view pública de comprovantes, insert direto fechado (Tarefa 3.1) | `0006_votacao.sql`, commit `5f3bf7e` (entrou pelo PR #10) |
| Documentação da votação e da verificação institucional manual (Tarefas 3.1 e 3.2) | `docs/votacao.md` |
| Projetos de exemplo no banco (Tarefa 3.3) | `supabase/seed_projetos.sql` (3 projetos `[SEED]` em produção) |

## Commits por pessoa

`git shortlog -sn --all` em 29/10/2026: João Batista 41 · Ana Beatriz 11 (10 como `anabeatrizlsf` e 1 como "Ana Beatriz Ferreira") · Guilherme 2 (`guiaraujo`).

O número de commits não mede o tamanho da contribuição: a Ana entrega em poucos commits grandes, o Guilherme trabalhou boa parte no painel do Supabase (criação do projeto, aplicação das migrations, contas), o que não aparece no Git, e parte do trabalho da Ana nas Semanas 2 e 3 chegou em arquivo e foi commitada pelo João.

## Semana 4 (em andamento)

| Pessoa | Branch | Tarefas |
|---|---|---|
| Ana | `feature/feed-projetos-origem` | 4.1 Feed ↔ Projetos pelo campo origem · 4.2 ajustes e revisão do banco · 4.3 responsividade |
| Guilherme | `feature/integracao-seguranca-deploy` | 4.1 aplicar 0007 a 0009 e testes ponta a ponta · 4.2 bugs e queries · 4.3 segurança e backup · 4.4 deploy e README |
| João | `feature/polimento-feed-mapa` | 4.2 clusters no mapa novo · 4.3 responsividade do Feed e visual de Painel e Criar projeto · roteiro da apresentação |
