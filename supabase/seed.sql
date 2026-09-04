insert into public.categories (name, slug, sort_order) values
('日常','daily',1),('开发','dev',2),('动漫','anime',3),('游戏','game',4),('生活','life',5),('效率','productivity',6),('音乐','music',7),('资源','resources',8)
on conflict (name) do nothing;

insert into public.articles (slug,title,excerpt,content,category,author,published_at,read_minutes,views,likes,image_url,featured,published,tags) values
('sakura-life-notes','在樱花落下之前，给自己的生活加一点可爱','把忙碌的日常拆成柔软的小片段。','["我们常常以为生活需要一次很大的改变，才会变得有趣。","真正能让一天发光的，往往是那些很小、很具体的瞬间。"]','日常','Mia','2026-08-28',5,1842,126,'https://cdn.pixabay.com/photo/2025/12/24/08/06/anime-girl-10032460_1280.jpg',true,true,array['生活','记录','随笔']),
('flutter-web-animation-notes','Flutter Web 动画手记：让界面更轻盈的 6 个细节','不用复杂的第三方库，也能做出舒服的网页体验。','["动画的价值不是炫技，而是帮助用户理解界面发生了什么。"]','开发','Neko Dev','2026-08-26',8,2310,203,'https://cdn.pixabay.com/photo/2025/12/01/12/11/anime-girl-9988017_1280.jpg',true,true,array['Flutter','Web','UI']),
('anime-weekend-list','本月动画清单：适合周末一口气看完的作品','从治愈日常到轻科幻。','["这份清单的标准很简单：希望打开之后能很快进入状态。"]','动漫','Yuki','2026-08-22',6,3214,298,'https://cdn.pixabay.com/photo/2025/04/17/12/03/girl-9540346_1280.jpg',false,true,array['动漫','推荐'])
on conflict (slug) do nothing;

insert into public.moments (content,mood,published_at,tags,image_url,published)
select seed.content, seed.mood, seed.published_at::date, seed.tags, seed.image_url, true
from (values
  ('把文章页的阅读节奏重新整理了一遍。比起再加一个漂亮卡片，我更喜欢这种读起来安静、用起来顺手的改动。','开发记录','2026-09-02',array['Next.js','UI'],'https://cdn.pixabay.com/photo/2025/12/01/12/11/anime-girl-9988017_1280.jpg'),
  ('最近重新整理了自己的收藏夹：真正需要的不是更多链接，而是更少、更容易再次找到的内容。','碎碎念','2026-08-31',array['效率','生活'],'https://cdn.pixabay.com/photo/2025/12/24/08/06/anime-girl-10032460_1280.jpg'),
  ('周末适合把歌单调低一点，开一盏暖色灯，慢慢看完一篇长文章。','日常','2026-08-29',array['音乐','阅读'],'https://cdn.pixabay.com/photo/2025/04/17/12/03/girl-9540346_1280.jpg')
) as seed(content,mood,published_at,tags,image_url)
where not exists (select 1 from public.moments where moments.content = seed.content);
