-- Supports forgot-username/forgot-password: login is by username, but
-- Supabase Auth itself only knows email+password, so logging in needs a
-- username -> email lookup. `profiles` is publicly readable (policy
-- "profiles are publicly readable" using(true)), so email can NEVER be
-- added as a column there -- anyone could select it for every user. This
-- function is the only sanctioned way to go from a username to an email:
-- SECURITY DEFINER so it can read auth.users (not exposed via the API
-- otherwise), and scoped to return just the one matching address.
create or replace function public.username_to_email(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.username = p_username
  limit 1
$$;

revoke all on function public.username_to_email(text) from public;
grant execute on function public.username_to_email(text) to anon, authenticated;
