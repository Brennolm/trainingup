<?php

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\ProfileController;
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
    Route::post('forgot-password', [PasswordResetController::class, 'sendLink'])->middleware('throttle:password-email');
    Route::post('reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [LoginController::class, 'destroy']);
        Route::post('email/verify', [EmailVerificationController::class, 'verify'])->middleware('throttle:verify-code');
        Route::post('email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:resend-code');
    });
});

// Who is signed in (data: null for guests). Works before e-mail verification so the SPA knows
// where to send the user.
Route::get('/user', MeController::class);

// The app itself: signed in and e-mail confirmed.
Route::middleware(['auth:sanctum', 'verified.email'])->group(function () {
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile/preferences', [ProfileController::class, 'preferences']);
});
