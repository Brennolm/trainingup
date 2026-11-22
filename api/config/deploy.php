<?php

return [

    /*
    | Deploy finalization (see docs/DEPLOY.md).
    | The deploy branch ships a DEPLOY_VERSION file with the commit SHA. The scheduler runs
    | `deploy:finalize` every minute; when the version changes it runs migrations and caches.
    */
    'version_file' => env('DEPLOY_VERSION_FILE', base_path('DEPLOY_VERSION')),

    'marker_file' => env('DEPLOY_MARKER_FILE', storage_path('app/private/deployed_version')),

    // Rebuild config/route/view caches after deploying (production only by default).
    'cache' => env('DEPLOY_CACHE', env('APP_ENV') === 'production'),

    /*
    | Daily database backup (`backup:database`).
    */
    'backup_path' => env('BACKUP_PATH', storage_path('app/private/backups')),

    'backup_keep' => (int) env('BACKUP_KEEP', 7),

];
