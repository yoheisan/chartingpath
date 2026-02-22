-- Pause all social posting cron jobs
SELECT cron.unschedule('post-patterns-to-social');
SELECT cron.unschedule('schedule-educational-posts-daily');
SELECT cron.unschedule('social-media-scheduler');