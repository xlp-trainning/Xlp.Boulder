-- Grupo de prueba: quien abre la app con el enlace …/Xlp.Boulder/?prueba queda marcado (en los datos de su cuenta
-- anónima, cohort = 'prueba') y el máster lo ve en la pestaña Usuarios. Amplía las funciones de 015.
-- Ejecútalo una vez en Supabase → SQL Editor, después de 015. Se puede repetir sin problema.

drop function if exists public.admin_users(text, int);

-- 4) Resumen para el máster
create or replace function public.admin_user_summary()
returns json language plpgsql stable security definer set search_path = '' as $$
declare r json;
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  with act as (
    select u.id, u.created_at,
           greatest(u.last_sign_in_at, (select max(updated_at) from public.ratings x where x.user_id = u.id),
                    (select max(created_at) from public.comments c where c.user_id = u.id)) as seen
    from auth.users u
  )
  select json_build_object(
    'total',     (select count(*) from act),
    'with_nick', (select count(*) from public.climbers),
    'ranking',   (select count(*) from public.climbers where in_ranking),
    'active_7',  (select count(*) from act where seen > now() - interval '7 days'),
    'active_30', (select count(*) from act where seen > now() - interval '30 days'),
    'new_7',     (select count(*) from act where created_at > now() - interval '7 days'),
    'sending',   (select count(distinct user_id) from public.ratings where sent),
    'blocked',   (select count(*) from public.blocked_users),
    'cohort',    (select count(*) from auth.users where raw_user_meta_data->>'cohort' = 'prueba')
  ) into r;
  return r;
end $$;

-- 5) Lista para el máster: los que tienen algo (apodo, votos o betas), lo más reciente primero
create or replace function public.admin_users(p_q text default '', p_limit int default 200)
returns table (user_id uuid, nick text, in_ranking boolean, has_pin boolean, created_at timestamptz, last_seen timestamptz,
               sends int, sends_30 int, rated int, comments int, groups int, is_setter boolean, blocked boolean, reason text, cohort text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_master() then raise exception 'solo el máster' using errcode = '42501'; end if;
  return query
  with base as (
    select u.id, u.created_at, u.last_sign_in_at, u.raw_user_meta_data->>'cohort' as cohort, c.nick, coalesce(c.in_ranking, false) as in_ranking, c.pin_hash is not null as has_pin
    from auth.users u left join public.climbers c on c.user_id = u.id
  ), agg as (
    select b.*,
      (select count(*)::int from public.ratings r where r.user_id = b.id and r.sent) as sends,
      (select count(*)::int from public.ratings r where r.user_id = b.id and r.sent and r.sent_at > now() - interval '30 days') as sends_30,
      (select count(*)::int from public.ratings r where r.user_id = b.id) as rated,
      (select count(*)::int from public.comments m where m.user_id = b.id) as comments,
      (select count(*)::int from public.group_members g where g.user_id = b.id) as groups,
      greatest(b.last_sign_in_at, (select max(r.updated_at) from public.ratings r where r.user_id = b.id),
               (select max(m.created_at) from public.comments m where m.user_id = b.id)) as last_seen
    from base b
  )
  select a.id, a.nick, a.in_ranking, a.has_pin, a.created_at, a.last_seen, a.sends, a.sends_30, a.rated, a.comments, a.groups,
         exists (select 1 from public.setters s where s.user_id = a.id),
         exists (select 1 from public.blocked_users k where k.user_id = a.id),
         (select k.reason from public.blocked_users k where k.user_id = a.id),
         a.cohort
  from agg a
  where (a.nick is not null or a.rated > 0 or a.comments > 0 or a.cohort is not null or exists (select 1 from public.blocked_users k where k.user_id = a.id))
    and (coalesce(btrim(p_q), '') = '' or a.nick ilike '%' || btrim(p_q) || '%')
  order by a.last_seen desc nulls last
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
end $$;

revoke execute on function public.admin_user_summary() from public;
revoke execute on function public.admin_users(text, int) from public;
grant execute on function public.admin_user_summary() to authenticated;
grant execute on function public.admin_users(text, int) to authenticated;

notify pgrst, 'reload schema';
