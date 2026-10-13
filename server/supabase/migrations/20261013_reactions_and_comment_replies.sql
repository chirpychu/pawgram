-- Animal-emoji reactions on posts and comments, plus threaded comment
-- replies. Applied directly to the live project via the Supabase MCP
-- connector; recorded here so the schema stays tracked in git.

-- Animal-emoji reactions on posts: extend the existing `likes` table
-- (one reaction per user per post, matching its existing PK) with a
-- `reaction` column restricted to a fixed set of animal emoji.
alter table public.likes
  add column if not exists reaction text not null default '🐾';

alter table public.likes
  drop constraint if exists likes_reaction_check;

alter table public.likes
  add constraint likes_reaction_check
  check (reaction in ('🐾','🐶','🐱','🐰','🦊','🐻','🐼','🐯'));

-- Threaded replies: self-referencing parent on the existing `comments` table.
alter table public.comments
  add column if not exists parent_comment_id uuid references public.comments(id) on delete cascade;

create index if not exists comments_parent_comment_id_idx
  on public.comments (parent_comment_id);

create index if not exists comments_post_id_idx
  on public.comments (post_id);

-- Animal-emoji reactions on comments (and replies, since replies are just
-- rows in `comments`), one reaction per user per comment.
create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default '🐾' check (reaction in ('🐾','🐶','🐱','🐰','🦊','🐻','🐼','🐯')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_reactions enable row level security;

create policy comment_reactions_select
  on public.comment_reactions for select
  using (
    exists (
      select 1 from public.comments c
      join public.posts po on po.id = c.post_id
      where c.id = comment_reactions.comment_id
        and (
          auth.uid() = po.author_id
          or exists (select 1 from public.profiles p where p.id = po.author_id and p.is_private = false)
          or exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = po.author_id)
        )
    )
  );

create policy comment_reactions_manage_own
  on public.comment_reactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
