# Auditoria do sistema (Semana 5)

Auditoria feita sobre a `main` com os PRs #17 e #18: segurança, banco, interface e fluxos. O que foi corrigido está marcado; o que depende de decisão do time ficou como pendência.

## Como foi testado

| Frente | Ferramenta | Resultado |
|---|---|---|
| Ponta a ponta (E2E) | Playwright no Edge, `npm run e2e` (47 testes + 9 de acessibilidade) | Visitante, cidadã e gestor; mapa, filtros, formulários, bloqueio de acesso, celular |
| Tentativas de burlar o banco | `npm run test:rls` (script do Guilherme) | 25 bloqueados, 0 furos |
| Migrations em Postgres real | PGlite: `supabase/testes/testar-0016.mjs` e o script da Ana | 30 cenários na 0016, todos corretos |
| Cabeçalhos HTTP e CSP | `npm run test:headers` + E2E com a CSP ligada | 0 violações nas telas principais |
| Acessibilidade | axe (WCAG A e AA) dentro do E2E | Contraste e estrutura corrigidos (ver abaixo) |
| Dependências | `npm audit` | 0 vulnerabilidades |
| Código | busca por `innerHTML`, `eval`, segredos no repositório | Nada fora do que já era escapado |
| Leitura anônima do banco | consultas só de leitura com a chave pública | Dois vazamentos achados (abaixo) |

Os testes E2E usam as contas demo e **só leem**: nenhum publica, vota ou apaga.

## Achados de segurança

| # | Gravidade | Achado | Situação |
|---|---|---|---|
| S1 | Alta | **Regras de etapa só existiam na tela.** Pela API, o órgão dono podia pular etapas, reabrir um projeto rejeitado, mexer no prazo de uma consulta e reescrever datas, sem nenhum rastro | Corrigido na 0016: `publicar_atualizacao()` valida dono, etapa, marco e prazo no servidor e grava o histórico; o update direto dessas colunas foi fechado |
| S2 | Alta | **Nome completo de todas as contas legível por qualquer pessoa.** A tela promete mostrar só o primeiro nome, mas `GET /profiles` devolvia o nome inteiro para visitantes (privacidade, LGPD) | Corrigido na 0016: o público lê a view `perfis_publicos` (primeiro nome); cada pessoa lê só o próprio perfil |
| S3 | Alta | **Contas demo com senha pública no repositório**, incluindo a do gestor verificado, que em produção responde por um órgão, abre e encerra consultas e publica respostas oficiais | **Pendente (decisão do time).** Antes de abrir o sistema ao público real: trocar as senhas, ou desligar os botões demo da tela de entrada |
| S4 | Média | Sem cabeçalhos de segurança (CSP, nosniff, referrer, permissions). Só vinham HSTS e X-Frame-Options | Corrigido no `vercel.json`; CSP testada contra todas as telas |
| S5 | Média | Textos sem limite de tamanho no banco (relato, projeto): pela API dava para gravar megabytes | Corrigido na 0016 (limites para o que entrar daqui para frente) |
| S6 | Baixa | `post_apoios` listava publicamente quem apoiou o quê | Corrigido na 0016: cada pessoa lê só os próprios apoios; a contagem pública segue pela view |
| S7 | Baixa | Sem limite de ritmo (rate limit) para criar relatos, comentários e apoios | Pendente: usar as proteções do Supabase (limites do Auth já valem) ou um limite por função |
| S8 | Info | Chave pública (anon) no front-end | Esperado: o que protege é o RLS, que foi testado |

O que já estava certo e foi confirmado: voto só pela função `votar()`, sem leitura da tabela `votos`; autor de relato anônimo oculto; ninguém se promove a órgão; ninguém edita perfil ou projeto alheio; cadastro fechado; tooltip do mapa escapa HTML.

## Achados de interface e acessibilidade

| # | Achado | Situação |
|---|---|---|
| U1 | Texto secundário e dourado abaixo do contraste mínimo 4,5:1 (grafite-500 a 4,3:1; amarelo-700 a 3,1:1) em quase todas as telas | Corrigido: os tons foram escurecidos levemente (`#6a655a` e `#8a6406`); a cor principal e o logo não mudaram |
| U2 | Lista de números da landing com `dl/dt/dd` aninhados de forma inválida (leitores de tela leem errado) | Corrigido |
| U3 | `aria-label` em elementos sem papel (títulos animados e a faixa de texto) | Corrigido |
| U4 | Central do órgão: lista crescia a página inteira | Corrigido: lista com altura própria, rolagem fina, teclado (↑ ↓ Esc), "mostrar mais" e "voltar ao topo" |
| U5 | Atualização de projeto era "escolher e publicar", sem contexto | Corrigido: quatro perguntas, efeito de cada etapa, confirmação para rejeitar, texto e foto, prévia, e histórico visível na página do projeto |
| U6 | Frases animadas da landing contam como baixo contraste durante a animação | Aceito: é o estado intermediário do efeito; o texto final passa |

## Bugs e riscos de comportamento

- **Atualizar projeto e o banco:** a tela nova chama a função do servidor. Se a 0016 ainda não foi aplicada, o app volta ao jeito antigo (update direto) e **não quebra**, mas sem histórico, foto ou regras do servidor. Depois da 0016, o jeito antigo deixa de funcionar de propósito.
- **Votos e mudança de etapa:** nada impede o órgão de abrir uma consulta de novo depois de aprovada; agora a função recusa (só o caminho proposto → consulta → aprovado/rejeitado → execução → concluído).
- **Foto de perfil e de relato:** dependem da 0015 (bucket). Sem ela, o envio mostra um aviso claro e o resto funciona.
- **Mapa:** nenhuma violação de CSP; o mapa carrega com a política ligada.
- **Tela de entrada:** os 404 de `perfis_publicos` e `projeto_atualizacoes` no console, antes das migrations, são esperados; o app trata e segue.

## Ordem para aplicar no banco

1. 0011 → 0016, nesta ordem, no SQL Editor (todas idempotentes).
2. `supabase/semana5_limpeza_e_projetos.sql` (Passo 1 confere, Passo 2 aplica).
3. `npm run test:rls` e `npm run e2e` para confirmar.

## Como rodar os testes

```
npm run e2e              # compila e roda os testes de ponta a ponta no Edge
npm run test:rls         # tentativas de burlar o banco com as contas demo
npm run test:headers     # cabeçalhos de segurança (aceita uma URL publicada)
node supabase/testes/testar-0016.mjs supabase/migrations   # regras da 0016 em Postgres local (precisa do PGlite, ver o cabeçalho do arquivo)
```
