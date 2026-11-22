<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['code_hash', 'attempts', 'expires_at', 'sent_at'])]
#[Hidden(['code_hash'])]
class EmailVerificationCode extends Model
{
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'sent_at' => 'datetime',
            'attempts' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
