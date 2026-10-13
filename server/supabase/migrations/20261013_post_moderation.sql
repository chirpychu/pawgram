-- Pet/animal content moderation: schema support.
-- Applied to the live project in separate chunks (see session notes) because
-- combined migrations with constraint drops have been silently cancelled
-- before. Kept here as the single source of truth for the schema.

-- 1. pg_net lets a Postgres trigger make an async HTTP call out to the
--    moderate-post Edge Function without blocking the INSERT.
create extension if not exists pg_net;

-- 2. System-generated notifications (like "your post was removed") have no
--    human actor, so actor_id must become nullable. `message` carries the
--    human-readable reason shown in the notification bell.
alter table public.notifications alter column actor_id drop not null;
alter table public.notifications add column if not exists message text;

-- 3. Widen the notification type check to allow the new system type.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type = any (array['follow_request','follow_accepted','post_reaction','comment_reaction','post_removed']));

-- 4. Trigger: whenever a post_images row is inserted (i.e. a post gets its
--    media attached), asynchronously ask the moderate-post Edge Function to
--    check whether the post is actually pet/animal-related, and to delete
--    it + notify the author if not. Fire-and-forget: pg_net queues the HTTP
--    call and returns immediately, so posting itself is never slowed down.
create or replace function public.trigger_moderate_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://bdpgwaeaubsxbxydjvfo.supabase.co/functions/v1/moderate-post',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcGd3YWVhdWJzeGJ4eWRqdmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzA1NjksImV4cCI6MjEwNzA0NjU2OX0.LWry_M73He_GePXzIE4NaR1P24gA-aRTFuTtFa0WvE8'
    ),
    body := jsonb_build_object('post_id', new.post_id)
  );
  return new;
end;
$$;

drop trigger if exists moderate_post_on_image_insert on public.post_images;
create trigger moderate_post_on_image_insert
  after insert on public.post_images
  for each row
  execute function public.trigger_moderate_post();
