
SELECT cron.alter_job(137, schedule := '*/5 12-23,0-4 * * *');
SELECT cron.alter_job(177, schedule := '1,6,11,16,21,26,31,36,41,46,51,56 12-23,0-4 * * *');
SELECT cron.alter_job(138, schedule := '2,7,12,17,22,27,32,37,42,47,52,57 12-23,0-4 * * *');
SELECT cron.alter_job(178, schedule := '3,8,13,18,23,28,33,38,43,48,53,58 12-23,0-4 * * *');
SELECT cron.alter_job(139, schedule := '4,9,14,19,24,29,34,39,44,49,54,59 12-23,0-4 * * *');
SELECT cron.alter_job(140, schedule := '2,7,12,17,22,27,32,37,42,47,52,57 12-23,0-4 * * *');
