-- Direct messages, with a privacy gate: anyone can message a public
-- account, but a private account can only be messaged by people it has
-- accepted a follow request from. Applied directly to the live project
-- via the Supabase MCP connector; recorded here so the schema stays
-- tracked in git.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_sender_id_idx on public.messages (sender_id, created_at desc);
create index messages_recipient_id_idx on public.messages (recipient_id, created_at desc);

alter table public.messages enable row level security;

-- Either side of a conversation can read it.
create policy messages_participant_select
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- The recipient marks messages read.
create policy messages_recipient_update
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- The sender can delete a message they sent.
create policy messages_sender_delete
  on public.messages for delete
  using (auth.uid() = sender_id);

-- The core privacy rule: you can always message a public account, but a
-- private one only if you're an accepted follower of theirs.
create policy messages_sender_insert
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and sender_id <> recipient_id
    and (
      exists (select 1 from public.profiles p where p.id = recipient_id and p.is_private = false)
      or exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = recipient_id and f.status = 'accepted'
      )
    )
  );
