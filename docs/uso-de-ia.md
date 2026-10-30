# Uso de IA generativa

## No produto

O Confluência **não usa IA** no funcionamento. Repercussão, atrasos, votação e notificações são regras fixas e explicáveis, escritas em SQL e TypeScript. A simulação de "antes e depois" do relato é uma ilustração pronta por categoria, não uma imagem gerada.

## No desenvolvimento

### Ferramenta

O João usou o **Claude Code** (assistente de programação da Anthropic, no terminal e ligado ao navegador) como par de programação. Ana e Guilherme registram aqui o uso que fizeram, se houver.

### Onde a IA entrou

| Parte | O que a IA fez | O que ficou com o time |
|---|---|---|
| Scaffold e adiantamento das Semanas 1 e 2 (PR #1) | Gerou a base do Feed, de Projetos, das telas de login e o rascunho das migrations 0001 a 0004 a partir dos guias | Revisão; Guilherme revisou e aplicou o SQL; Ana revisou a 0003 linha por linha |
| Repaginada (visual, landing, camada social) | Escreveu o código a partir dos pedidos do João, mediu o desempenho no navegador e corrigiu | Direção visual, o que manter e o que jogar fora (ver abaixo) |
| Integração da Semana 3 (PR #10) | Resolveu os conflitos, renumerou as migrations, ligou as telas novas ao `api.ts` da Ana | Decisão de mesclar e de como dividir a Semana 4 |
| Revisão de código | Revisou o zip da Semana 3 da Ana e achou o curinga do `LIKE` em `verificar_comprovante` | Correção aceita e aplicada |
| Guias semanais e esta documentação | Redigiu a partir do código, do histórico do Git e de consultas ao banco | Conferência e envio ao time |

### O que o time corrigiu ou rejeitou

A IA errou e foi corrigida várias vezes. Os casos mais importantes:

| O que a IA propôs ou fez | O que aconteceu |
|---|---|
| Landing com mapa 3D girando, efeito de lanterna, cartões flutuando e fitas cruzadas com texto | Rejeitado: "travando" e "muito IA". Ficou só o título e a janela do mapa; o mapa virou uma foto estática com movimento em CSS |
| `backdrop-blur` nas barras e painéis | Deixava a rolagem lenta; trocado por fundos sólidos |
| Seções "Como funciona" e "Experimente agora" simples demais | Refeitas com cenas animadas do app e crachás das contas demo |
| Fotos com efeito só no hover | Trocado por um carrossel infinito |
| Excesso de travessões nos textos | Reescritos |
| Disse que não existia branch da semana para a Ana | Errado; corrigido depois de conferir o histórico |
| Primeira versão do antes e depois (1855 e hoje) não mostrava a foto nova | Bug de animação achado no teste e corrigido |

### Regras que o time seguiu

- Nada entra na `main` sem PR e revisão humana.
- A IA não muda logo nem cor principal sem pedir, e não aumenta o escopo de Ana e Guilherme.
- Envio para o GitHub (push) só com autorização explícita do João.
- Chaves e senhas reais não passam pela IA; só a chave pública do Supabase e a senha pública das contas de demonstração.
- Tudo que a IA afirma sobre o banco em produção é conferido com consultas reais antes de ir para a documentação.
