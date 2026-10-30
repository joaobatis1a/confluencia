# Visão do produto

## O problema

Todo dia alguém no Recife passa por um buraco, um poste apagado ou uma calçada quebrada e segue em frente. Quando a pessoa reclama, a reclamação some num canal fechado (telefone, protocolo, rede social) e ninguém sabe se mais gente tem o mesmo problema, se alguém do governo leu, nem o que aconteceu depois.

Do outro lado, quando a prefeitura faz uma obra, a população raramente é ouvida antes e quase nunca consegue acompanhar o andamento depois. O ciclo **problema → resposta → decisão → obra** existe, mas fica invisível.

## A proposta

O Confluência junta os dois lados num mesmo lugar público. O nome vem da imagem de rios que se encontram, como o Capibaribe e o Beberibe no Recife: governo e população no mesmo espaço de diálogo.

O ciclo completo:

1. **Relato.** O cidadão marca no mapa onde está o problema, escolhe a categoria e descreve. Pode publicar anônimo (em Segurança, sempre anônimo).
2. **Repercussão.** O relato ganha peso pela recorrência (outros relatos da mesma categoria no mesmo bairro em 30 dias) e pelos apoios. A soma é pensada para que bairros com menos acesso à internet não sumam: dois relatos parecidos numa área já chamam atenção.
3. **Resposta oficial.** Um órgão público verificado responde ao relato, com um status: recebido, em análise, virou projeto, resolvido ou não procede.
4. **Consulta pública.** O órgão publica um projeto. Enquanto está em consulta, a população vota a favor ou contra. O voto é secreto, mas auditável: quem vota recebe um comprovante (hash) e qualquer pessoa pode conferir que aquele comprovante existe, sem saber de quem é nem em que opção foi.
5. **Obra acompanhada.** Projeto aprovado ganha uma linha do tempo pública, com data prevista e data real de cada marco. Atraso aparece em vermelho, em dias.

## Para quem

| Público | O que ganha |
|---|---|
| Cidadão | Um lugar para relatar que não some, ver que outras pessoas têm o mesmo problema e acompanhar o que foi feito |
| Órgão público | Os problemas organizados por área e por peso, um canal para responder e uma consulta pública pronta |
| Imprensa, vereadores, pesquisadores | Um mapa aberto do que a cidade relata e do que o governo promete e cumpre |

## Princípios

- **Tudo público, menos o voto e o autor anônimo.** Relatos, respostas, projetos e prazos são abertos. A escolha de voto nunca aparece, nem para o órgão.
- **Peso justo.** A repercussão soma recorrência e apoios em vez de contar curtidas, para não premiar só quem tem mais seguidores.
- **Não prometer o que não entrega.** A simulação de "antes e depois" do relato é ilustrativa e diz isso na tela. O resultado da consulta é consultivo: orienta a decisão, mas não a obriga.
- **A cidade no centro.** O mapa é a interface principal, não um enfeite.

## Escopo do MVP (apresentação na primeira semana de dezembro)

Dentro:

- Feed com mapa 3D/2D, relatos reais, filtros por categoria e bairro, busca, repercussão, apoios, comentários, respostas oficiais, simulação ilustrativa e notificações
- Projetos com listagem por etapa, detalhe com proposta, estimativa, fotos e linha do tempo, consulta pública com voto secreto e comprovante, verificação de comprovante
- Painel de gestor (só contas institucionais verificadas) com projetos do órgão, inclusive rejeitados, e publicação de atualizações
- Perfil público com relatos, respostas, projetos acompanhados, bairros seguidos e dados da conta
- Landing page e duas contas de demonstração (cidadã e gestor)

Fora (registrado no [plano de evolução](limitacoes-e-proximos-passos.md)):

- Identidade oficial (CPF / gov.br) na votação
- Modelo preditivo real de impacto urbano
- Moderação automática de conteúdo
- Cadastro aberto ao público (fechado no MVP; entra-se pelas contas de demonstração)
