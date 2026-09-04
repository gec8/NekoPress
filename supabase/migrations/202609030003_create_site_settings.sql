begin;
alter table public.categories add column if not exists description text not null default '';
alter table public.categories add column if not exists color text not null default '#ec4899';
alter table public.categories add column if not exists visible boolean not null default true;
create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  site_name text not null default 'NekoPress',
  site_description text not null default '动漫、游戏、开发与生活灵感的个人内容站。',
  logo_url text not null default '',
  default_cover_url text not null default '/images/default-cover.svg',
  posts_per_page int not null default 6 check (posts_per_page between 1 and 20),
  comments_require_approval boolean not null default true,
  seo_title text not null default 'NekoPress',
  seo_description text not null default '动漫、游戏、开发与生活灵感的个人内容站。',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (true) on conflict (id) do nothing;
alter table public.site_settings enable row level security;
drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings" on public.site_settings for select using (true);
grant select on public.site_settings to anon, authenticated;
grant all privileges on public.site_settings to service_role;
grant all privileges on public.categories to service_role;
drop policy if exists "public can create pending comments" on public.comments;
create policy "public can create comments according to settings" on public.comments
  for insert with check (
    approved = not coalesce((select comments_require_approval from public.site_settings where id = true), true)
    and char_length(message) between 1 and 1000
  );
commit;
