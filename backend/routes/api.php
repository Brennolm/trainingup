<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\GoogleAccountController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\TwoFactorChallengeController;
use App\Http\Controllers\ConsentController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TwoFactorController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'app' => config('app.name'),
    'time' => now()->toIso8601String(),
]));

// Authentication (Sanctum SPA, cookie session). Rate limiters: AppServiceProvider.
Route::prefix('auth')->group(function () {
    Route::post('register', RegisterController::class)->middleware('throttle:register');
    Route::post('login', [LoginController::class, 'store'])->middleware('throttle:login');
    Route::post('two-factor-challenge', TwoFactorChallengeController::class)->middleware('throttle:two-factor');
    Route::post('forgot-password', [PasswordResetController::class, 'sendLink'])->middleware('throttle:password-email');
    Route::post('reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset');

    // Finish a Google sign-up (Google data waits in the session).
    Route::get('google/pending', [GoogleAccountController::class, 'pending']);
    Route::post('google/complete', [GoogleAccountController::class, 'complete'])->middleware('throttle:register');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [LoginController::class, 'destroy']);
        Route::post('email/verify', [EmailVerificationController::class, 'verify'])->middleware('throttle:verify-code');
        Route::post('email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:resend-code');
    });
});

// Who is signed in (data: null for guests). Works before e-mail verification so the SPA knows
// where to send the user.
Route::get('/user', MeController::class);

// LGPD rights: available as soon as signed in (even before confirming the e-mail).
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/consents', [ConsentController::class, 'index']);
    Route::post('/consents', [ConsentController::class, 'store']);
    Route::get('/profile/export', [AccountController::class, 'export'])->middleware('throttle:export');
    Route::delete('/profile', [AccountController::class, 'destroy'])->middleware('throttle:two-factor');
});

// The app itself: signed in and e-mail confirmed.
Route::middleware(['auth:sanctum', 'verified.email'])->group(function () {
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile/preferences', [ProfileController::class, 'preferences']);
    Route::put('/profile/password', [PasswordController::class, 'update'])->middleware('throttle:password-reset');
    Route::delete('/auth/google', [GoogleAccountController::class, 'unlink']);

    Route::middleware('throttle:two-factor')->group(function () {
        Route::post('/profile/two-factor', [TwoFactorController::class, 'store']);
        Route::post('/profile/two-factor/confirm', [TwoFactorController::class, 'confirm']);
        Route::delete('/profile/two-factor', [TwoFactorController::class, 'destroy']);
        Route::post('/profile/two-factor/recovery-codes', [TwoFactorController::class, 'recoveryCodes']);
    });
});
