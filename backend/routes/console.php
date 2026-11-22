<?php

use Illuminate\Support\Facades\Schedule;

/*
| Shared hosting has no long-running worker: the hPanel cron runs `schedule:run` every minute.
| See docs/DEPLOY.md.
*/

// Post-deploy tasks (migrations, caches) once per published version.
Schedule::command('deploy:finalize')->everyMinute()->withoutOverlapping();

// Process queued jobs (e-mails etc.) without a permanent worker.
Schedule::command('queue:work --stop-when-empty --max-time=50 --tries=3')
    ->everyMinute()
    ->withoutOverlapping();

// Daily database backup, 7-day retention.
Schedule::command('backup:database')
    ->dailyAt('03:00')
    ->timezone('America/Sao_Paulo')
    ->withoutOverlapping();
