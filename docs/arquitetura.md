# Arquitetura

## Visão geral

O Confluência é uma aplicação de página única (SPA) em React que fala direto com o Supabase. Não existe servidor próprio: as regras de negócio que precisam ser confiáveis (quem pode votar, gerar o hash do voto, quem cria projeto, quem vê o autor de um relato) ficam no banco, em políticas de Row Level Security (RLS), funções `security definer` e views.

```
Navegador (React SPA, Vercel)
   │  supabase-js (chave pública "anon" + sessão do usuário)
   ▼
Supabase
   ├─ Auth .................. e-mail e senha
   ├─ Postgres + RLS ........ tabelas, views e funções (supabase/migrations)
   └─ API REST automática ... PostgREST
Mapas
   └─ OpenFreeMap (estilo Positron) + OpenStreetMap ... só leitura, sem chave
```

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Interface | React 19 + TypeScript 6 + Vite 8 | Rápido para desenvolver, tipagem do contrato de dados |
| Estilo | Tailwind CSS v4, tokens em `src/index.css` (`@theme`) | O design system vira classes (`bg-amarelo-500`, `font-heading`) |
| Rotas | React Router 7 | Rotas por página, cada uma carregada sob demanda |
| Animação | Framer Motion (interface) e GSAP + ScrollTrigger + SplitText (landing e títulos) | Framer para estados de componente; GSAP para animações presas à rolagem |
| Mapa do Feed | MapLibre GL 6 + react-map-gl + deck.gl (`HexagonLayer`, `ScatterplotLayer`) | Mapa vetorial 3D com colunas de repercussão, sem chave de API |
| Banco e login | Supabase (Postgres, Auth, RLS) | Banco, autenticação e API prontos, sem backend para manter |
| Deploy | Vercel, ligado ao GitHub | Publica a cada merge na `main` e gera preview por PR |
| Qualidade | `tsc -b`, oxlint | Tipagem e lint em todo build |

## Estrutura de pastas

```
src/
  App.tsx              rotas (todas com React.lazy) e a barra de navegação
  main.tsx             entrada
  index.css            tokens do design system e animações em CSS (@keyframes)
  context/AuthContext.tsx   sessão, perfil e signIn/signOut
  lib/
    supabase.ts        cliente; isSupabaseConfigured diz se há .env.local
    repercussao.ts     níveis de repercussão (baixa/média/alta)
    contasDemo.ts      e-mails das contas de demonstração e a senha pública
  types/database.ts    contrato de dados em TypeScript (espelha as migrations)
  components/          compartilhados: NavBar, Notificacoes, BotaoRelatar, ui.tsx, Marquee...
  pages/
    landing/           landing page (HeroPortal, MapaCidade, Manifesto, ComoFunciona...)
    auth/LoginPage.tsx tela de Entrar com as contas demo
    perfil/PerfilPage  só redireciona para /u/:id
  features/
    feed/              módulo Feed (João)
      pages/           FeedPage, CreatePostPage, PostDetailPage, PerfilPublicoPage
      components/      MapaVivo, MapaEscolha, RelatoItem, Comentarios, RespostasOficiais...
    projetos/          módulo Projetos (Ana)
      api.ts           TODAS as consultas de Projetos (real ou mock)
      vitrine.ts       junta projetos do banco com os exemplos p1 a p6
      timeline.ts      atraso de cada marco (lógica pura)
      pages/           ProjetosPage, ProjetoDetailPage, PainelGestorPage, CriarProjetoPage
      components/      Cedula, LinhaDoTempo, VerificarComprovante, AtualizacaoForm...
supabase/
  migrations/          0001 a 0009, aplicar em ordem
  seed-*.sql           dados de exemplo
docs/                  esta documentação
```

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Landing | Público |
| `/entrar` | Entrar (contas demo) | Público |
| `/cadastro` | Redireciona para `/entrar?cadastro=1` | Público |
| `/feed` | Mapa e lista de relatos | Público |
| `/feed/novo` | Relatar problema | Logado |
| `/feed/:id` | Detalhe do relato | Público |
| `/projetos` | Lista de projetos | Público |
| `/projetos/:id` | Detalhe e votação | Público (votar exige login) |
| `/projetos/novo` | Criar projeto | Institucional verificado (`RequireInstitutional`) |
| `/painel` | Painel do gestor | Institucional verificado |
| `/u/:id` | Perfil (`?aba=relatos|respostas|acompanhando|bairros|conta`) | Público; aba Conta só para o dono |
| `/perfil` | Redireciona para o próprio `/u/:id` | Logado |

A barra do app some em `/` e `/entrar`, que têm navegação própria. O `vercel.json` reescreve qualquer rota para `index.html`, para que abrir `/projetos/p1` direto não dê 404.

## Fluxo de dados

### Feed

- **Leitura:** sempre pela view `posts_repercussao`, que já traz recorrência, apoios e repercussão calculados. Depois da migration 0009, a tabela `posts` não expõe mais a coluna do autor; a view mostra o autor só quando o relato não é anônimo (ou para o próprio autor).
- **Escrita:** `insert` em `posts` (relato), `post_apoios` (apoio), `comentarios`, `respostas_oficiais` e `bairros_seguidos`. O RLS garante que cada um escreve só em nome próprio.
- **Notificações:** criadas por gatilhos no banco (resposta oficial, comentário, apoio, relato novo em bairro seguido). O front só lê e marca como lida.

### Projetos

As telas nunca chamam o Supabase direto: tudo passa por `features/projetos/api.ts`, que tem duas implementações para cada função.

| Situação | O que `api.ts` faz |
|---|---|
| Com `.env.local` (Supabase configurado) | Lê `projetos` e `votos_resultado`; vota pela função `votar`; atualiza pelo RLS do órgão dono |
| Sem `.env.local` (modo demonstração) | Usa os mocks de `mock.ts` e guarda votos e comprovantes em memória |

`vitrine.ts` soma aos projetos do banco os seis projetos de exemplo (p1 a p6), que têm foto, proposta, estimativa e galeria. Com o banco ligado, eles aparecem mas não aceitam voto (não existem na tabela).

### Votação

1. A cédula (`Cedula.tsx`) chama `votar(projeto, opcao)` em `api.ts`.
2. A função `votar` do banco confere login, opção, status `em_consulta` e prazo, grava o voto e devolve o hash gerado no próprio banco.
3. Voto repetido bate na restrição `UNIQUE (projeto_id, user_id)` e volta como "você já votou".
4. Ao abrir a página, `meu_comprovante` devolve o hash do próprio usuário (nunca a opção). É assim que o "já votou" sobrevive a um recarregamento.
5. O placar vem da view agregada `votos_resultado`. Ninguém consegue ler a tabela `votos`.

Detalhes em [Votação](votacao.md) e [Banco de dados](banco-de-dados.md).

## Mapas

| Onde | Como |
|---|---|
| Feed (`MapaVivo.tsx`) | MapLibre com estilo Positron do OpenFreeMap. deck.gl desenha colunas hexagonais de repercussão (3D) ou pontos por categoria (2D). Pinos a menos de 30 px na tela viram um grupo com o número de relatos (`feed/agrupar.ts`); o clique aproxima até separar. Tooltip escapa o texto do usuário antes de virar HTML |
| Detalhe do relato (`MapaOrbita.tsx`) | Câmera inclinada que dá meia volta em 12 s em torno do ponto e para |
| Relatar (`MapaEscolha.tsx`) | MapLibre para marcar o ponto; `isWithinRecifeMetro` (de `lib/regiao.ts`) recusa pontos fora da Região Metropolitana |
| Landing (`MapaCidade.tsx`) | Renderiza o Recife em 3D uma vez, tira uma "foto" do canvas (`preserveDrawingBuffer` + `toDataURL`), posiciona os pinos em porcentagem e desmonta o mapa. A animação continua só com CSS, sem WebGL rodando |

## Desempenho

O primeiro protótipo da landing travava. O que resolveu, medido no navegador (tempo por quadro, alvo de 16 ms):

| Problema | Antes | Solução | Depois |
|---|---|---|---|
| Mapa 3D girando no topo da landing | ~120 ms por quadro | Foto estática do mapa + movimento em CSS | ~16 ms |
| `backdrop-blur` em barras e painéis sobre conteúdo em movimento | ~20 ms ao rolar | Fundos sólidos | ~16 ms |
| Janela do topo animando `clip-path` | Recalculo de pintura a cada quadro | Escala por `transform` com o conteúdo em escala inversa | Roda no compositor |
| Animações contínuas em JavaScript | Ocupavam a thread principal | `@keyframes` em `src/index.css` | Roda no compositor |
| Mapa do Feed redesenhando a tela inteira a cada quadro (pulso dos relatos no estado do React) | ~560 ms de JS por segundo parado | Pulso trocado direto no overlay, só com relato recente | ~25 ms/s |
| Mapa do relato girando para sempre | ~570 ms de JS por segundo parado | Meia volta de 12 s e para | ~50 ms/s |
| Pacote principal de 2,2 MB | Tudo carregado na primeira visita | `React.lazy` por rota e mapa da landing à parte | 618 kB (184 kB gzip) |

Quem prefere menos movimento (`prefers-reduced-motion`) recebe a versão sem animação: as animações de GSAP retornam cedo e a classe `.anima-continua` desliga os `@keyframes`.

## Segurança

- A chave do Supabase no front é a pública (`anon`). Tudo que importa é protegido no banco pelo RLS, não pela interface.
- Voto: insert direto em `votos` fechado; só a função `votar` grava; opção nunca é legível individualmente.
- Conta institucional: o próprio usuário não consegue se marcar como verificado (update de `profiles` liberado só por coluna: `nome`, `apelido`, `bairro`, `bio`).
- Projeto: só institucional verificado cria; só o órgão dono edita, e só as colunas de gestão; rejeitado fica visível só para o dono.
- Anonimato: em Segurança o banco força `anonimo = true` por gatilho; a 0009 fecha a coluna do autor na tabela `posts`.
- Texto de usuário nunca vira HTML sem escapar (tooltip do mapa).
- `.env.local` não vai para o repositório; as chaves de produção ficam nas variáveis de ambiente da Vercel.

## Deploy

- **Frontend:** Vercel, ligado ao repositório. Merge na `main` publica em produção; cada PR ganha um link de preview.
- **Variáveis:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (modelo em `.env.example`).
- **Banco:** migrations aplicadas pelo SQL Editor do Supabase, em ordem. Situação atual em [Banco de dados](banco-de-dados.md#o-que-esta-aplicado-em-producao).
- **Sem `.env.local`,** o app abre mesmo assim: Projetos roda em modo demonstração (mocks e votação simulada em memória), o Feed fica vazio (ele lê só do banco) e não há login.
