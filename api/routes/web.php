<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;

// API-only application: the web UI is the React PWA at the main domain.
Route::get('/', fn () => response()->json(['name' => config('app.name')]));

// Sign in with Google: full-page redirects (need the web session, not JSON).
Route::middleware('throttle:google')->group(function () {
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);
});
