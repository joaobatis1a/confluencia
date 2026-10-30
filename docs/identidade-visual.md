# Identidade visual

A base é o design system v2.1 (`confluencia-design.pdf`, nos documentos de planejamento), aplicada como tokens em `src/index.css`. A repaginada de outubro manteve marca, cor principal e fontes e mudou a forma de usar: mais tipografia grande, a cidade como imagem principal e movimento ligado à rolagem.

## Marca

- **Logo:** círculo amarelo com o traço de dois rios que se encontram (`public/logo.png`). Não muda sem combinar com o time.
- **Nome:** Confluência, a imagem do Capibaribe e do Beberibe se encontrando; governo e população no mesmo lugar.
- **Frase:** "Sua cidade tem voz."

## Cores

| Token | Valor | Uso |
|---|---|---|
| `amarelo-500` | `#F5B800` | **Cor principal.** Botões de ação, destaques, a consulta aberta, o crachá de marca |
| `amarelo-700` | `#B8860B` | Texto amarelo sobre fundo claro (rótulos, itálicos de destaque) |
| `amarelo-100` / `amarelo-50` | `#FFF3C4` / `#FFFBEA` | Fundos suaves |
| `grafite-50` | `#FDFBF4` | **Fundo creme** de todas as telas |
| `grafite-100` a `grafite-500` | `#F3F0E8` a `#7C776C` | Cartões, bordas, texto secundário |
| `grafite-900` | `#1B1813` | Texto principal. Escuro quente, não preto puro |
| `status-verde` | `#16A34A` | A favor, concluído, cumprido |
| `status-vermelho` | `#DC2626` | Contra, rejeitado, repercussão alta |
| `status-terracota` | `#C2410C` | Atraso |
| `status-azul` | `#2563EB` | Informação (resposta "recebido", "em análise") |

Cada categoria tem uma cor própria no mapa e nos cartões (`features/feed/cores.ts`).

**Regras combinadas:**

- Preto nunca é a cor principal de uma tela. Áreas escuras são exceção (um botão, um selo).
- Amarelo não significa "pendente". Ele marca ação ou atenção; status usa verde, vermelho, terracota e azul.
- Repercussão vai de neutro a amarelo a vermelho; é o único lugar em que o amarelo indica "ganhando atenção".

## Tipografia

| Fonte | Token | Uso |
|---|---|---|
| Bricolage Grotesque | `font-heading` | Títulos, números grandes, botões. Peso 800 nos títulos |
| Public Sans | `font-body` | Texto corrido, formulários |
| Instrument Serif itálico | `font-serif italic` | Só destaque de uma ou duas palavras ("tem *voz*", "o Recife *agora*") |

## Formas

- Cartões bem arredondados (`rounded-[28px]` a `rounded-[32px]`); campos com `--radius-field` (10px).
- Pílulas para filtros, categorias e status.
- Linhas topográficas (`Topografia.tsx`) e listras diagonais finas como textura, nunca fundo de bolinhas.

## Movimento

O movimento tem função: mostrar onde a pessoa está, o que mudou e o que é dela.

| Onde | O quê |
|---|---|
| Landing | Letras do título sobem de uma máscara; a janela do mapa abre conforme a rolagem; o manifesto acende palavra por palavra |
| Projetos | Título do projeto revelado por linhas; linha do tempo que se preenche com a rolagem; carimbo "voto registrado" na cédula |
| Feed | Câmera do mapa voa até o relato escolhido; colunas sobem no modo 3D |
| Geral | Transição entre páginas; filtros com indicador deslizante |

**Regras de movimento (aprendidas com a landing travando):**

- Animação contínua vai em CSS (`@keyframes` em `src/index.css`), não em JavaScript.
- Sem `backdrop-blur` em áreas grandes ou sobre conteúdo que se move.
- Animar `transform` e `opacity`; evitar `clip-path`, `width` e `filter` em animação longa.
- Sempre respeitar `prefers-reduced-motion`.

## O que o time rejeitou

Registrado para não voltar: efeito de lanterna no topo, cartões flutuando sobre o título, fitas cruzadas com texto, rodapé de texto no hero e excesso de travessões nos textos. O motivo comum: pareciam enfeite genérico, "cara de IA", sem dizer nada sobre a cidade.
