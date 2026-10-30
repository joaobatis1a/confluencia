# Limitações e próximos passos

## O que o MVP não faz

| Limitação | Por quê | Impacto |
|---|---|---|
| Identidade é e-mail e senha, sem CPF ou gov.br | Fora do escopo do MVP; integração exige credenciamento | Uma pessoa pode criar várias contas e votar mais de uma vez. O resultado é consultivo e a interface diz isso |
| Cadastro fechado | Evita contas falsas e spam na demonstração | Só as contas de demonstração entram |
| Verificação de órgão é manual | Não há fluxo de documentos | O administrador marca `institucional_verificado` no painel do Supabase |
| Anonimato do voto depende de confiar em quem administra o banco | `votos` guarda `user_id` e `opcao` na mesma linha para bloquear voto duplicado | Quem tem acesso de administrador consegue cruzar os dois |
| Comprovante prova que o voto existe, não que foi contado | Não há prova criptográfica de inclusão | Auditoria parcial |
| Simulação de "antes e depois" é ilustrativa | Não existe modelo preditivo de impacto urbano | Diz "ilustrativa" na tela |
| Sem moderação | Fora do escopo | Relato ofensivo ou falso fica no ar até alguém apagar no banco |
| Sem envio de foto no relato | Upload ficou para depois (`foto_url` existe na tabela) | Relatos só com texto e local |
| Repercussão simples | Soma recorrência (30 dias, mesma categoria e bairro) e apoios | Não pondera população do bairro nem distância real entre relatos |
| Sem testes automatizados | Prazo de 4 semanas | Regressões só aparecem em teste manual |
| Projetos de exemplo misturados aos reais | Demonstração com foto e conteúdo | Exemplos não aceitam voto quando o banco está ligado |

## Próximos passos

### Antes da apresentação (primeira semana de dezembro)

Detalhados nos guias individuais da Semana 4:

- **Guilherme:** aplicar 0007, 0008, seeds e 0009; remover uma das funções de voto; filtrar rejeitados em `comprovantes_publicos`; testar burlas; backup; deploy e README.
- **Ana:** ligar Feed e Projetos pelo campo de origem nos dois sentidos; testar o fluxo de voto no banco real; responsividade de Projetos.
- **João:** repaginar Painel e Criar projeto; roteiro da apresentação. (Clusters no mapa novo e responsividade do Feed entraram no PR #12.)
- **Todos:** apagar os dados `[SEED]` que aparecem ao público.

### Depois do MVP

1. **Identidade oficial:** login gov.br para votar; manter e-mail e senha para relatar.
2. **Voto com anonimato forte:** separar quem votou (para bloquear duplicidade) da opção escolhida, em tabelas sem ligação entre si.
3. **Fotos nos relatos:** upload no Supabase Storage, com limite de tamanho e remoção de metadados de localização da imagem.
4. **Moderação:** denúncia pela população e fila de revisão para o órgão.
5. **Repercussão mais justa:** ponderar pela população do bairro e agrupar relatos por distância real, não só pelo nome do bairro.
6. **Testes:** unitários para `timeline.ts`, `repercussao.ts` e `api.ts`; testes do RLS com contas de papel diferente; um teste de ponta a ponta do ciclo relato → projeto → voto.
7. **Dados abertos:** exportar relatos, respostas e prazos em CSV para imprensa e pesquisa.
8. **Outras cidades:** o centro do mapa, os bairros e a validação de região estão fixos no Recife; virar configuração.

## Indicadores para um piloto

| Indicador | Por quê |
|---|---|
| Tempo até a primeira resposta oficial | Mostra se o órgão está ouvindo |
| Relatos com resposta / total de relatos | Cobertura |
| Relatos que viraram projeto | O ciclo fechando |
| Marcos entregues no prazo | Confiança nas promessas |
| Relatos por bairro, ponderados pela população | Se a periferia está aparecendo |
| Participação nas consultas | Engajamento real |
