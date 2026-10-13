-- Lets a post's media be a short video instead of just a photo. Reuses
-- the existing post_images table/post-images bucket (position-ordered
-- media per post) rather than a parallel table, since the only real
-- difference is how the client renders it.
alter table public.post_images
  add column if not exists media_type text not null default 'image';

alter table public.post_images
  add constraint post_images_media_type_check
  check (media_type in ('image', 'video'));

-- Server-side cap to match: the project is on Supabase's Free plan,
-- which hard-caps any single upload at 50MB project-wide, so 45MB
-- leaves a little headroom under that ceiling. This is enforced by
-- Storage itself, independent of (and in addition to) the client-side
-- size check in the composer.
update storage.buckets
set
  file_size_limit = 47185920, -- 45 MB in bytes
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
where id = 'post-images';
