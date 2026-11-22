<?php

return [

    // SPEC 1: adults only.
    'min_age' => 18,

    // SPEC 6.2: e-mail verification code.
    'verification' => [
        'code_length' => 6,
        'ttl_minutes' => 15,
        'max_attempts' => 5,
        'resend_cooldown_seconds' => 60,
    ],

    // Version of each legal text the user accepts (recorded in `consents`).
    // Bump when the text changes; final texts arrive in phase 3.
    'legal_versions' => [
        'terms' => env('LEGAL_TERMS_VERSION', '2026-11-draft'),
        'privacy' => env('LEGAL_PRIVACY_VERSION', '2026-11-draft'),
    ],

];
