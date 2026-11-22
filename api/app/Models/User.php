<?php

namespace App\Models;

use App\Enums\LengthUnit;
use App\Enums\Role;
use App\Enums\Theme;
use App\Enums\WeightUnit;
use App\Notifications\ResetPasswordNotification;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'birth_date', 'theme', 'weight_unit', 'length_unit', 'locale'])]
#[Hidden(['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** Same defaults as the database, so new instances are complete before a refresh. */
    protected $attributes = [
        'role' => 'user',
        'theme' => 'dark',
        'weight_unit' => 'kg',
        'length_unit' => 'cm',
        'locale' => 'pt_BR',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'birth_date' => 'date',
            'password' => 'hashed',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'array',
            'two_factor_confirmed_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'role' => Role::class,
            'theme' => Theme::class,
            'weight_unit' => WeightUnit::class,
            'length_unit' => LengthUnit::class,
        ];
    }

    public function hasVerifiedEmail(): bool
    {
        return $this->email_verified_at !== null;
    }

    /** 2FA counts only once the first code was confirmed. */
    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_confirmed_at !== null && $this->two_factor_secret !== null;
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin;
    }

    /** @return BelongsTo<Plan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /** @return HasMany<Consent, $this> */
    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    /** @return HasMany<Questionnaire, $this> */
    public function questionnaires(): HasMany
    {
        return $this->hasMany(Questionnaire::class);
    }

    /** The latest version of the questionnaire (draft or completed), if any. */
    public function currentQuestionnaire(): ?Questionnaire
    {
        return $this->questionnaires()->with('healthScreening')->orderByDesc('version')->first();
    }

    /** @return HasOne<EmailVerificationCode, $this> */
    public function emailVerificationCode(): HasOne
    {
        return $this->hasOne(EmailVerificationCode::class);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
