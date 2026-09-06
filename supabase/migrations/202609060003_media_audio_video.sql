update storage.buckets
set file_size_limit=52428800,
    allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','image/avif','audio/mpeg','audio/wav','audio/ogg','video/mp4','video/webm']
where id='media';
