-- SEED DE TESTE de projetos (Tarefa 3.3)
-- ANTES DE RODAR: troque SEU_EMAIL pelo e-mail de uma conta institucional verificada.
-- Rode UMA vez. Limpar: delete from projetos where nome like '[SEED]%';
with u as (select id from auth.users where email = 'SEU_EMAIL')
insert into projetos (orgao_id, nome, descricao, categoria, status, timeline, consulta_fim)
select u.id, v.nome, v.descricao, v.categoria::categoria_post, v.status::status_projeto,
       v.timeline::jsonb, v.consulta_fim
from u, (values
  ('[SEED] Reforma da iluminação da Av. Boa Viagem',
   'Troca de 120 luminárias por LED em toda a orla.',
   'iluminacao', 'em_consulta',
   '[{"nome":"Consulta pública","data_prevista":"2026-11-15","data_real":null},{"nome":"Licitação","data_prevista":"2026-12-20","data_real":null}]',
   now() + interval '20 days'),
  ('[SEED] Ciclovia em Casa Amarela',
   'Nova ciclovia ligando a Estrada do Arraial ao Parque da Jaqueira.',
   'mobilidade', 'proposto',
   '[]',
   null),
  ('[SEED] Revitalização da Praça de Madalena',
   'Reforma de calçadas, bancos e playground.',
   'pracas_lazer', 'em_execucao',
   '[{"nome":"Licitação","data_prevista":"2026-08-10","data_real":"2026-08-12"},{"nome":"Obras","data_prevista":"2026-12-01","data_real":null}]',
   now() - interval '40 days')
) as v(nome, descricao, categoria, status, timeline, consulta_fim);