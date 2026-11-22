<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** A calculation parameter changed in the admin (defaults: App\Support\Settings). */
#[Fillable(['key', 'value', 'updated_by'])]
class AppSetting extends Model
{
    protected function casts(): array
    {
        return ['value' => 'json'];
    }
}
