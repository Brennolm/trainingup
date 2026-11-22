<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'is_active'])]
class Plan extends Model
{
    public const FREE = 'free';

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public static function free(): self
    {
        return static::where('slug', self::FREE)->firstOrFail();
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
