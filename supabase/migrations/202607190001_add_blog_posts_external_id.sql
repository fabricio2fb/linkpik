alter table public.blog_posts
add column if not exists external_id text;

create unique index if not exists blog_posts_external_id_unique
on public.blog_posts(external_id)
where external_id is not null;
