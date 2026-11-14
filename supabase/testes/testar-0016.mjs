// Testa a migration 0016 (atualizações com regras no servidor, privacidade dos perfis,
// limites de tamanho e apoios) num Postgres de verdade em memória (PGlite).
//   (fora do projeto) npm i @electric-sql/pglite@0.4.0   e copie este arquivo para lá
//   node testar-0016.mjs <repo>/supabase/migrations
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import fs from 'node:fs'
const dir = process.argv[2]
const db = new PGlite({ extensions: { pgcrypto } })
await db.exec(`create role anon nologin; create role authenticated nologin;
create schema auth; create schema extensions;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth, extensions to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;`)
const migs = fs.readdirSync(dir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()
for (const f of migs) await db.exec(fs.readFileSync(dir + '/' + f, 'utf8'))
await db.exec(fs.readFileSync(dir + '/0016_atualizacoes_e_privacidade.sql', 'utf8'))
console.log('0016 reaplicada ok')
const ORG = '11111111-1111-1111-1111-111111111111', OUT = '22222222-2222-2222-2222-222222222222', CID = '33333333-3333-3333-3333-333333333333'
await db.exec(`insert into auth.users (id,email) values ('${ORG}','o@x'),('${OUT}','p@x'),('${CID}','c@x');
update profiles set institucional_verificado=true, orgao_nome='Prefeitura', nome='Maria Souza Lima' where id='${ORG}';
update profiles set institucional_verificado=true, nome='Outro Orgao' where id='${OUT}';
update profiles set nome='Ana Beatriz Costa' where id='${CID}';`)
const como = async (uid, sql, params) => {
  await db.exec(uid ? `set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);` : `set role anon; select set_config('request.jwt.claim.sub', '', false);`)
  try { return await db.query(sql, params).then((r) => r, (e) => e) } finally { await db.exec('reset role') }
}
const ok = (c, m) => console.log(c ? '  ✓' : '  ✗ FALHA:', m)
const proj = (await como(ORG, `insert into projetos (orgao_id,nome,descricao,categoria,status,timeline) values ('${ORG}','P','d','iluminacao','proposto','[{"nome":"Projeto","data_prevista":"2026-09-01","data_real":null},{"nome":"Licitação","data_prevista":"2026-12-01","data_real":null}]') returning id`)).rows[0].id
const rpc = (uid, args) => como(uid, `select * from publicar_atualizacao($1::uuid, $2::int, $3::date, $4::status_projeto, $5::timestamptz, $6, $7)`, args)
const dias = (n) => new Date(Date.now() + 86400000 * n).toISOString()
const FOTO = 'https://abc.supabase.co/storage/v1/object/public/fotos/x.jpg'
let r
r = await rpc(ORG, [proj, 0, '2026-09-03', null, null, 'Projeto técnico pronto', null]); ok(r.rows?.[0]?.timeline?.[0]?.data_real === '2026-09-03', 'conclui marco ' + (r.message ?? ''))
r = await rpc(ORG, [proj, 0, '2026-09-04', null, null, null, null]); ok(r.code === 'CF021', 'marco já feito recusado: ' + r.message)
r = await rpc(ORG, [proj, 1, '2099-01-01', null, null, null, null]); ok(r.code === 'CF020', 'data futura recusada: ' + r.message)
r = await rpc(ORG, [proj, 9, '2026-09-04', null, null, null, null]); ok(r.code === 'CF021', 'marco inexistente: ' + r.message)
r = await rpc(ORG, [proj, null, null, 'concluido', null, null, null]); ok(r.code === 'CF021', 'pular etapa recusado: ' + r.message)
r = await rpc(ORG, [proj, null, null, 'em_consulta', null, null, null]); ok(r.code === 'CF020', 'consulta sem prazo recusada: ' + r.message)
r = await rpc(ORG, [proj, null, null, 'em_consulta', dias(5), 'Consulta aberta', FOTO]); ok(r.rows?.[0]?.status === 'em_consulta', 'abre consulta com foto ' + (r.message ?? ''))
r = await rpc(ORG, [proj, null, null, null, null, 'x', 'https://evil.com/x.jpg']); ok(r.code === 'CF020', 'foto de fora recusada')
r = await rpc(ORG, [proj, null, null, null, dias(1), null, null]); ok(r.code === 'CF020', 'prazo menor que o atual recusado: ' + r.message)
r = await rpc(ORG, [proj, null, null, null, dias(20), 'Prorrogada', null]); ok(r.rows?.length === 1, 'prorroga a consulta ' + (r.message ?? ''))
r = await rpc(OUT, [proj, null, null, null, null, 'invasão', null]); ok(r.code === '42501', 'outro órgão recusado')
r = await rpc(CID, [proj, null, null, null, null, 'x', null]); ok(r.code === '42501', 'cidadã recusada')
r = await rpc(null, [proj, null, null, null, null, 'x', null]); ok(r.code === '42501' || r.code === '28000', 'anônimo recusado: ' + r.message)
r = await rpc(ORG, [proj, null, null, 'rejeitado', null, 'Encerrada', null]); ok(r.rows?.[0]?.status === 'rejeitado', 'encerra consulta ' + (r.message ?? ''))
r = await rpc(ORG, [proj, null, null, 'em_consulta', dias(5), null, null]); ok(r.code === 'CF021', 'reabrir rejeitado recusado: ' + r.message)
r = await como(ORG, `update projetos set status='em_consulta' where id='${proj}'`); ok(r.code === '42501', 'update direto de status bloqueado: ' + r.message)
r = await como(ORG, `update projetos set timeline='[]' where id='${proj}'`); ok(r.code === '42501', 'update direto da timeline bloqueado')
r = await como(ORG, `select count(*)::int n from projeto_atualizacoes where projeto_id='${proj}'`); ok(r.rows?.[0]?.n === 4, 'histórico gravado: ' + r.rows?.[0]?.n)
r = await como(ORG, `select status_de, status_para from projeto_atualizacoes where status_para is not null order by created_at`); ok(r.rows?.map((x) => x.status_de + '>' + x.status_para).join(',') === 'proposto>em_consulta,em_consulta>rejeitado', 'histórico guarda de>para: ' + r.rows?.map((x) => x.status_de + '>' + x.status_para))
r = await como(null, `select count(*)::int n from projeto_atualizacoes`); ok(r.rows?.[0]?.n === 0, 'rejeitado: histórico invisível ao público')
r = await como(ORG, `insert into projeto_atualizacoes (projeto_id,orgao_id,texto) values ('${proj}','${ORG}','forjado')`); ok(r.code === '42501', 'insert direto no histórico bloqueado')
r = await como(null, `select * from profiles`); ok(r.code === '42501' || r.rows?.length === 0, 'anon não lê profiles')
r = await como(CID, `select id, nome from profiles`); ok(r.rows?.length === 1 && r.rows[0].nome === 'Ana Beatriz Costa', 'cada um lê só o próprio perfil')
r = await como(null, `select nome from perfis_publicos order by nome`); ok(r.rows?.map((x) => x.nome).join(',') === 'Ana,Maria,Outro', 'view mostra só o primeiro nome: ' + r.rows?.map((x) => x.nome))
const post = (await como(CID, `insert into posts (user_id,categoria,bairro,descricao,latitude,longitude) values ('${CID}','iluminacao','Boa Vista','Poste apagado',-8.06,-34.89) returning id`)).rows[0].id
await como(OUT, `insert into post_apoios (post_id,user_id) values ('${post}','${OUT}')`)
r = await como(null, `select count(*)::int n from post_apoios`); ok(r.rows?.[0]?.n === 0 || r.code === '42501', 'anon não lista quem apoiou')
r = await como(CID, `select count(*)::int n from post_apoios`); ok(r.rows?.[0]?.n === 0, 'outra pessoa não vê o apoio alheio')
r = await como(OUT, `select count(*)::int n from post_apoios`); ok(r.rows?.[0]?.n === 1, 'cada um vê o próprio apoio')
r = await como(null, `select interacoes from posts_repercussao where id='${post}'`); ok(r.rows?.[0]?.interacoes === 1, 'contagem pública continua pela view: ' + JSON.stringify(r.rows?.[0] ?? r.message))
r = await como(CID, `insert into posts (user_id,categoria,bairro,descricao,latitude,longitude) values ('${CID}','iluminacao','Boa Vista','${'x'.repeat(1500)}',-8.06,-34.89)`); ok(r.code === '23514', 'descrição gigante recusada: ' + (r.message ?? '').slice(0, 60))
r = await como(ORG, `insert into projetos (orgao_id,nome,descricao,categoria) values ('${ORG}','${'n'.repeat(200)}','d','iluminacao')`); ok(r.code === '23514', 'nome de projeto gigante recusado')
