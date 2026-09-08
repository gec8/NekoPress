-- Check CMS membership without inheriting the profiles table's RLS context.
create or replace function public.is_cms_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'editor')
  );
$$;

revoke all on function public.is_cms_user() from public;
grant execute on function public.is_cms_user() to authenticated;

drop policy if exists "cms users can upload media" on storage.objects;
create policy "cms users can upload media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = 'uploads'
  and (select public.is_cms_user())
);
