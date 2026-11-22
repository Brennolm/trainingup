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
    // Bump together with frontend/src/locales (legal.*.version) when the text changes:
    // signed-in users are then asked to accept the new version.
    'legal_versions' => [
        'terms' => '2026-11-22',
        'privacy' => '2026-11-22',
    ],

    // SPEC 6.8: Google-only accounts type this word to confirm account deletion.
    'delete_confirmation_word' => 'EXCLUIR',

];
