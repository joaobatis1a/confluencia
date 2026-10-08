# Confluência

> Sua cidade, sua voz.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-animações-0055FF?logo=framer&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

Plataforma cívica digital para o Recife que conecta a população à gestão pública através de dois módulos — **Feed** (relatos de problemas urbanos) e **Projetos** (consulta pública e acompanhamento de execução) — unidos por uma camada de simulação visual.

Projeto de disciplina do 4º período. **Apresentação: 05/11/2026.**

🔗 **Demo:** [confluencia-liart.vercel.app](https://confluencia-liart.vercel.app)
*(ainda sem projeto Supabase real conectado — Feed e Projetos funcionam com dados de demonstração; ver [status do projeto](#status-atual))*

## Equipe

| Pessoa | Frente | GitHub |
|---|---|---|
| João Batista (líder) | Frontend Feed + Geolocalização | [@joaobatis1a](https://github.com/joaobatis1a) |
| Ana Beatriz | Frontend Projetos + apoio ao banco | [@anabeatrizlsf](https://github.com/anabeatrizlsf) |
| Guilherme Araújo | Backend / Auth / Votação / Deploy | [@guiaraujoo](https://github.com/guiaraujoo) |

## Status atual

Veja o [Pull Request #1](https://github.com/joaobatis1a/confluencia/pull/1) para o estado mais atualizado do projeto — Feed e Projetos já funcionam de ponta a ponta com dados de demonstração; falta só um projeto Supabase real (migrations prontas em `supabase/migrations/`) para os dados serem persistidos de verdade.

## Documentação do projeto

- [`docs/cronograma-atualizado.md`](docs/cronograma-atualizado.md) — cronograma até a apresentação (05/11)
- [`docs/contrato-de-dados.md`](docs/contrato-de-dados.md) — campos de cada tabela do banco
- Guias individuais atualizados (PDF, mesmo modelo dos originais): cada integrante recebeu o seu
- Design system: `confluencia-design.pdf` (v2.1) — paleta, tipografia, componentes

## Stack técnica

- **Frontend:** React + TypeScript + Vite
- **Estilo:** Tailwind CSS v4 (tokens do design system já aplicados em `src/index.css`)
- **Animações:** Framer Motion
- **Backend / Banco / Auth:** Supabase (Postgres + Auth + RLS)
- **Mapa:** React Leaflet
- **Deploy:** Vercel (frontend, conectado ao repositório — cada push gera um preview) + Supabase (backend)

## Como rodar localmente

```bash
git clone https://github.com/joaobatis1a/confluencia.git
cd confluencia
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase (Project Settings > API)
npm run dev
```

## Fluxo de trabalho (Git)

**Ninguém commita direto na `main`.** Toda tarefa nasce numa branch própria (`feature/`, `fix/`, `chore/`, `docs/`) e só entra via Pull Request revisado pelo líder.

Cada integrante tem uma branch inicial já criada para começar:

- `joao/feed-geolocalizacao`
- `ana/projetos-frontend`
- `guilherme/backend-core`

Use-as como ponto de partida para abrir suas branches de tarefa (ex: `feature/feed-mapa-leaflet` a partir de `joao/feed-geolocalizacao`, ou direto a partir de `main` — o que o seu guia individual indicar).

Detalhes completos do fluxo de Git/PR estão nos guias do líder e do time (fora deste repositório, nos documentos de planejamento).

## Estrutura de pastas

```
src/
  features/
    feed/       # módulo Feed (João)
    projetos/   # módulo Projetos (Ana)
  components/   # componentes compartilhados
  lib/
    supabase.ts # cliente Supabase configurado
  index.css     # tokens do design system (cores, fontes, radius)
supabase/
  migrations/   # schema SQL + RLS (Guilherme)
```

## Licença

Distribuído sob a licença MIT — veja [`LICENSE`](LICENSE). Projeto de autoria conjunta de João Batista, Ana Beatriz e Guilherme Araújo.
