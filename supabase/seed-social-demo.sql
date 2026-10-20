-- Confluência — dados de demonstração da camada social (rodar DEPOIS da 0006).
-- Contas demo (senha: confluencia2026): cidada.demo@confluencia.app / gestor.demo@confluencia.app
-- Idempotente: pode rodar de novo.

-- Perfis públicos
update profiles
set nome = 'Marina Albuquerque', apelido = 'marina.boavista', bairro = 'Boa Vista',
    bio = 'Moradora da Boa Vista. Ando de bike e a pé pelo centro.'
where id = (select id from auth.users where email = 'cidada.demo@confluencia.app');

update profiles
set nome = 'Secretaria de Mobilidade', apelido = 'mobilidade.recife', bairro = null,
    orgao_nome = 'Secretaria de Mobilidade (demo)', institucional_verificado = true,
    bio = 'Conta de demonstração de órgão público.'
where id = (select id from auth.users where email = 'gestor.demo@confluencia.app');

-- Resposta oficial: o relato da Rua da Aurora virou projeto
insert into respostas_oficiais (post_id, orgao_id, status, texto)
select p.id, g.id, 'virou_projeto',
       'Recebemos o relato e incluímos o trecho no projeto de iluminação em LED da Rua da Aurora, aprovado na consulta pública.'
from posts p, auth.users g
where p.descricao like 'Três postes apagados na Rua da Aurora%'
  and g.email = 'gestor.demo@confluencia.app'
  and not exists (select 1 from respostas_oficiais r where r.post_id = p.id);

-- Resposta oficial: buraco em análise
insert into respostas_oficiais (post_id, orgao_id, status, texto)
select p.id, g.id, 'em_analise',
       'Equipe de vistoria agendada para esta semana. Vamos atualizar aqui depois da visita.'
from posts p, auth.users g
where p.descricao like '[SEED] 05 buraco na via%'
  and g.email = 'gestor.demo@confluencia.app'
  and not exists (select 1 from respostas_oficiais r where r.post_id = p.id);

-- Comentário de vizinha num relato de iluminação
insert into comentarios (post_id, user_id, texto)
select p.id, u.id, 'Aqui na esquina de baixo também está apagado desde sexta.'
from posts p, auth.users u
where p.descricao like '[SEED] 01 poste apagado%'
  and u.email = 'cidada.demo@confluencia.app'
  and not exists (select 1 from comentarios c where c.post_id = p.id and c.user_id = u.id);

-- Conferência
select u.email, pr.apelido, pr.institucional_verificado from profiles pr join auth.users u on u.id = pr.id
where u.email like '%.demo@confluencia.app';
