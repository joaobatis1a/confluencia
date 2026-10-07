# Confluência

> Sua cidade, sua voz.

Plataforma cívica digital para o Recife que conecta a população à gestão pública através de dois módulos — **Feed** (relatos de problemas urbanos) e **Projetos** (consulta pública e acompanhamento de execução) — unidos por uma camada de simulação visual.

Projeto de disciplina do 4º período. **Apresentação: 05/11/2026.**

## Equipe

| Pessoa | Frente | GitHub |
|---|---|---|
| João Batista (líder) | Frontend Feed + Geolocalização | [@joaobatis1a](https://github.com/joaobatis1a) |
| Ana Beatriz | Frontend Projetos + apoio ao banco | [@anabeatrizlsf](https://github.com/anabeatrizlsf) |
| Guilherme Araújo | Backend / Auth / Votação / Deploy | [@guiaraujoo](https://github.com/guiaraujoo) |

## Documentação do projeto

- [`docs/cronograma-atualizado.md`](docs/cronograma-atualizado.md) — cronograma até a apresentação (05/11)
- Guias individuais atualizados (PDF, mesmo modelo dos originais): cada integrante recebeu o seu
- Design system: `confluencia-design.pdf` (v2.1) — paleta, tipografia, componentes

## Stack técnica

- **Frontend:** React + TypeScript + Vite
- **Estilo:** Tailwind CSS v4 (tokens do design system já aplicados em `src/index.css`)
- **Backend / Banco / Auth:** Supabase (Postgres + Auth + RLS)
- **Mapa:** React Leaflet
- **Deploy:** Vercel (frontend) + Supabase (backend)

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
```
