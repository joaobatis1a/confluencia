# Votação — versão simplificada (protótipo)

## Como funciona
- O voto é feito pela função `registrar_voto(projeto, opcao)`, que valida: login,
  opção (`favor`/`contra`), projeto existente, status `em_consulta` e prazo (`consulta_fim`).
- Um voto por usuário por projeto (`unique (projeto_id, user_id)` no banco).
- Ninguém lê a tabela `votos`, nem o próprio voto. O resultado é só agregado (`votos_resultado`).
- Comprovante: hash SHA-256 gerado no servidor (id do voto + projeto + instante + sal aleatório).
  O usuário recupera o próprio com `meu_comprovante(projeto)`.
- Auditoria pública: a view `comprovantes_publicos` lista os hashes por projeto, sem usuário,
  sem opção e sem data. A quantidade de hashes deve bater com `total_votos`.
- O insert direto na tabela `votos` está fechado (permission denied).

## Erros da função
`login_necessario`, `opcao_invalida`, `projeto_inexistente`, `votacao_encerrada`, `ja_votou`.

## Verificação institucional (Tarefa 3.2)
- Campo `profiles.institucional_verificado` (default false).
- Aprovação manual: o administrador marca o campo no painel do Supabase.
- RLS: só contas verificadas criam projetos. O usuário não consegue alterar o próprio campo
  (UPDATE por coluna restrito a `nome`).

## Fora do escopo desta versão
- Autenticação oficial (CPF / gov.br): hoje a identidade é e-mail e senha, então contas falsas
  são possíveis. Fica para a próxima fase (alinhado com o grupo antes da apresentação).
- Comprovante verificável criptograficamente (assinatura / prova de inclusão).
- Anonimato forte: quem tem acesso administrativo ao banco consegue, tecnicamente, cruzar
  `user_id` e `opcao`.