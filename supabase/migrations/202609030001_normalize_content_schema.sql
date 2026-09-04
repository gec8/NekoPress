-- Normalize the existing NekoPress database without deleting user data.
begin;

alter table public.articles add column if not exists image_url text;
alter table public.articles add column if not exists featured boolean;
alter table public.articles add column if not exists published boolean;
alter table public.articles add column if not exists tags text[];
update public.articles set image_url = '' where image_url is null;
update public.articles set featured = false where featured is null;
update public.articles set published = false where published is null;
update public.articles set tags = '{}' where tags is null;
alter table public.articles alter column image_url set default '';
alter table public.articles alter column image_url set not null;
alter table public.articles alter column featured set default false;
alter table public.articles alter column featured set not null;
alter table public.articles alter column published set default false;
alter table public.articles alter column published set not null;
alter table public.articles alter column tags set default '{}';
alter table public.articles alter column tags set not null;

alter table public.moments add column if not exists image_url text;
alter table public.moments add column if not exists published boolean;
alter table public.moments add column if not exists tags text[];
update public.moments set image_url = '' where image_url is null;
update public.moments set published = true where published is null;
update public.moments set tags = '{}' where tags is null;
alter table public.moments alter column image_url set default '';
alter table public.moments alter column image_url set not null;
alter table public.moments alter column published set default true;
alter table public.moments alter column published set not null;
alter table public.moments alter column tags set default '{}';
alter table public.moments alter column tags set not null;

alter table public.comments alter column approved set default false;
update public.comments set approved = false where approved is null;
alter table public.comments alter column approved set not null;

create index if not exists articles_public_feed_idx on public.articles (published, published_at desc);
create index if not exists articles_featured_idx on public.articles (featured, published, published_at desc);
create index if not exists moments_public_feed_idx on public.moments (published, published_at desc);
create index if not exists comments_moderation_idx on public.comments (approved, created_at desc);

alter table public.articles enable row level security;
alter table public.moments enable row level security;
alter table public.comments enable row level security;

drop policy if exists "public can read published articles" on public.articles;
create policy "public can read published articles" on public.articles for select using (published = true);
drop policy if exists "public can read published moments" on public.moments;
create policy "public can read published moments" on public.moments for select using (published = true);
drop policy if exists "public can read approved comments" on public.comments;
create policy "public can read approved comments" on public.comments for select using (approved = true);
drop policy if exists "public can create pending comments" on public.comments;
create policy "public can create pending comments" on public.comments for insert with check (approved = false and char_length(message) between 1 and 1000);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.articles, public.comments, public.moments to anon, authenticated;
grant insert on public.comments to anon, authenticated;
grant all privileges on public.categories, public.articles, public.comments, public.profiles, public.moments to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

commit;
