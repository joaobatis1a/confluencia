# Migrations do Supabase

Estas migrations ainda **não foram aplicadas** a nenhum projeto Supabase real — não temos um projeto criado ainda. O código está pronto para quando o Guilherme criar o projeto (Tarefa 1.1 do guia dele).

## Como aplicar

**Opção simples (painel):** copie o conteúdo de cada arquivo, na ordem numérica (`0001` → `0004`), e cole no SQL Editor do painel do Supabase (https://supabase.com/dashboard → seu projeto → SQL Editor → New query → Run).

**Opção com CLI** (se preferir):
```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

## Ordem e o que cada arquivo faz

| Arquivo | O que cria | Tarefa correspondente |
|---|---|---|
| `0001_posts.sql` | tabela `posts` + enum de categorias | Guilherme 1.1 |
| `0002_profiles.sql` | tabela `profiles` + trigger de criação automática no cadastro | Guilherme 1.4 |
| `0003_projetos_votos.sql` | tabelas `projetos`, `votos` + view agregada `votos_resultado` | Ana 1.2/2.2, Guilherme 3.1 |
| `0004_rls_policies.sql` | regras de acesso (quem pode ler/criar/editar o quê) | Guilherme 1.3 |

Depois de aplicar, copie a **Project URL** e a **anon public key** (Project Settings → API) para o seu `.env.local` (veja `.env.example` na raiz do repo).
