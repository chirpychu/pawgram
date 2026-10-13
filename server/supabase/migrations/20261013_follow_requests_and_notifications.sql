-- Private-account follow requests and a notifications system to surface
-- them. Applied directly to the live project via the Supabase MCP
-- connector; recorded here so the schema stays tracked in git.

-- A follow row can now be 'pending' (requested, awaiting approval) or
-- 'accepted' (a real follow). Existing rows default to 'accepted', which
-- preserves today's already-following relationships.
alter table public.follows
  add column if not exists status text not null default 'accepted';

alter table public.follows
  add constraint follows_status_check
  check (status in ('pending', 'accepted'));

-- The person being followed ("the target") needs to be able to approve
-- (update status -> accepted) or reject (delete) a pending request,
-- alongside the existing "users manage their own follows" policy that
-- lets the follower create/cancel their own row.
create policy follows_target_update
  on public.follows for update
  using (auth.uid() = following_id)
  with check (auth.uid() = following_id);

create policy follows_target_delete
  on public.follows for delete
  using (auth.uid() = following_id);

-- Notifications: currently just follow requests and follow-accepted
-- confirmations, but the type column leaves room to grow.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('follow_request', 'follow_accepted')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_recipient_id_created_at_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

-- The recipient can read their own notifications and mark them read/delete them.
create policy notifications_recipient_select
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy notifications_recipient_update
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy notifications_recipient_delete
  on public.notifications for delete
  using (auth.uid() = recipient_id);

-- The actor (whoever's action the notification is about — the requester
-- sending a request, or the target accepting one) can create and remove
-- notifications they generated. There's no server-side function doing
-- this, so the client inserts it directly as the acting user.
create policy notifications_actor_insert
  on public.notifications for insert
  with check (auth.uid() = actor_id);

create policy notifications_actor_delete
  on public.notifications for delete
  using (auth.uid() = actor_id);

-- Critical privacy fix: every policy that granted visibility into a
-- private account's posts/comments/likes/comment-reactions via "you
-- follow them" previously matched ANY follows row, pending or accepted.
-- That would have let a pending (unapproved) follow request see private
-- content before being approved. All four are tightened to accepted-only.
alter policy "posts respect author privacy" on public.posts
  using (
    (auth.uid() = author_id)
    or exists (select 1 from public.profiles p where p.id = posts.author_id and p.is_private = false)
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid() and f.following_id = posts.author_id and f.status = 'accepted'
    )
  );

alter policy "likes respect post visibility" on public.likes
  using (
    exists (
      select 1 from public.posts po
      where po.id = likes.post_id
        and (
          auth.uid() = po.author_id
          or exists (select 1 from public.profiles p where p.id = po.author_id and p.is_private = false)
          or exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid() and f.following_id = po.author_id and f.status = 'accepted'
          )
        )
    )
  );

alter policy "comments respect post visibility" on public.comments
  using (
    exists (
      select 1 from public.posts po
      where po.id = comments.post_id
        and (
          auth.uid() = po.author_id
          or exists (select 1 from public.profiles p where p.id = po.author_id and p.is_private = false)
          or exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid() and f.following_id = po.author_id and f.status = 'accepted'
          )
        )
    )
  );

alter policy comment_reactions_select on public.comment_reactions
  using (
    exists (
      select 1 from public.comments c
      join public.posts po on po.id = c.post_id
      where c.id = comment_reactions.comment_id
        and (
          auth.uid() = po.author_id
          or exists (select 1 from public.profiles p where p.id = po.author_id and p.is_private = false)
          or exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid() and f.following_id = po.author_id and f.status = 'accepted'
          )
        )
    )
  );
