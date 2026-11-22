<?php

namespace App\Enums;

// Display unit only: the database always stores centimeters (SPEC 2.3).
enum LengthUnit: string
{
    case Cm = 'cm';
    case FtIn = 'ft_in';
}
