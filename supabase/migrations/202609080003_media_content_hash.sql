alter table public.media_assets add column if not exists content_hash text;
create index if not exists media_assets_content_hash_idx on public.media_assets(content_hash) where content_hash is not null and status = 'ready';
