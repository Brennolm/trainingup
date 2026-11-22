<?php

namespace App\Enums;

// Display unit only: the database always stores kilograms (SPEC 2.3).
enum WeightUnit: string
{
    case Kg = 'kg';
    case Lb = 'lb';
}
