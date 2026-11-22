<?php

namespace App\Enums;

// SPEC 4: terms, privacy, health data, cookies.
enum ConsentType: string
{
    case Terms = 'terms';
    case Privacy = 'privacy';
    case HealthData = 'health_data';
    case Cookies = 'cookies';
}
