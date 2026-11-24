<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Admin\AlertController;
use App\Http\Controllers\Admin\ExerciseController as AdminExerciseController;
use App\Http\Controllers\Admin\MetricsController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\GoogleAccountController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\TwoFactorChallengeController;
use App\Http\Controllers\ConsentController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\ExerciseMediaController;
use App\Http\Controllers\ImpersonationController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuestionnaireController;
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

// Example image of an exercise (public: loaded by <img>, no personal data).
Route::get('/exercise-media/{file}', ExerciseMediaController::class);

// Who is signed in (data: null for guests). Works before e-mail verification so the SPA knows
// where to send the user.
Route::get('/user', MeController::class);

// LGPD rights: available as soon as signed in (even before confirming the e-mail).
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/consents', [ConsentController::class, 'index']);
    Route::post('/consents', [ConsentController::class, 'store']);
    Route::get('/profile/export', [AccountController::class, 'export'])->middleware('throttle:export');
    Route::delete('/profile', [AccountController::class, 'destroy'])->middleware('throttle:two-factor');

    // Leave "Ver como usuário" (the only call allowed while impersonating).
    Route::delete('/admin/impersonation', [ImpersonationController::class, 'destroy']);
});

// Admin panel (SPEC 6.5). Not reachable while impersonating (the request user is not the admin).
Route::middleware(['auth:sanctum', 'verified.email', 'admin'])->prefix('admin')->group(function () {
    Route::get('/metrics', MetricsController::class);
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users/{user}/impersonate', [AdminUserController::class, 'impersonate'])->middleware('throttle:two-factor');
    Route::get('/impersonation-logs', [AdminUserController::class, 'logs']);
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::post('/alerts/{alert}/resolve', [AlertController::class, 'resolve']);
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::get('/exercises', [AdminExerciseController::class, 'index']);
    Route::post('/exercises', [AdminExerciseController::class, 'store']);
    Route::put('/exercises/{exercise}', [AdminExerciseController::class, 'update']);
    Route::post('/exercises/{exercise}/image', [AdminExerciseController::class, 'storeImage']);
    Route::delete('/exercises/{exercise}/image', [AdminExerciseController::class, 'destroyImage']);
});

// The app itself: signed in and e-mail confirmed.
Route::middleware(['auth:sanctum', 'verified.email'])->group(function () {
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile/preferences', [ProfileController::class, 'preferences']);
    Route::put('/profile/password', [PasswordController::class, 'update'])->middleware('throttle:password-reset');
    Route::delete('/auth/google', [GoogleAccountController::class, 'unlink']);

    // Questionnaire and health screening (SPEC 6.3, 5.1).
    Route::get('/questionnaire', [QuestionnaireController::class, 'show']);
    Route::post('/questionnaire/consent', [QuestionnaireController::class, 'consent']);
    Route::post('/questionnaire', [QuestionnaireController::class, 'store']);
    Route::put('/questionnaire/sections/{section}', [QuestionnaireController::class, 'update']);
    Route::post('/questionnaire/complete', [QuestionnaireController::class, 'complete']);

    // Training (SPEC 5.5, 6.4).
    Route::get('/exercises', [ExerciseController::class, 'index']);

    Route::middleware('throttle:two-factor')->group(function () {
        Route::post('/profile/two-factor', [TwoFactorController::class, 'store']);
        Route::post('/profile/two-factor/confirm', [TwoFactorController::class, 'confirm']);
        Route::delete('/profile/two-factor', [TwoFactorController::class, 'destroy']);
        Route::post('/profile/two-factor/recovery-codes', [TwoFactorController::class, 'recoveryCodes']);
    });
});
