-- Let reacting to a post or comment notify the post/comment's owner who
-- reacted and with which animal emoji, same pattern as follow requests.

alter table public.notifications
  add column if not exists post_id uuid references public.posts(id) on delete cascade,
  add column if not exists comment_id uuid references public.comments(id) on delete cascade,
  add column if not exists reaction text;

-- Widen the allowed notification types to include the two reaction kinds.
alter table public.notifications
  drop constraint notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('follow_request', 'follow_accepted', 'post_reaction', 'comment_reaction'));

create index notifications_post_id_idx on public.notifications (post_id);
create index notifications_comment_id_idx on public.notifications (comment_id);

-- No new RLS policies needed: notifications_actor_insert/_delete already
-- let the reacting user (auth.uid() = actor_id) create and remove their
-- own reaction notifications, and notifications_recipient_select/_update
-- already let the post/comment owner read and mark them read.
