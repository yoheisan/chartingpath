UPDATE social_media_accounts SET is_active = false WHERE platform = 'twitter';
UPDATE educational_schedule_state SET is_active = false;
UPDATE scheduled_posts SET status = 'cancelled' WHERE status NOT IN ('posted', 'cancelled');