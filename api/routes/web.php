<?php

use Illuminate\Support\Facades\Route;

// API-only application: the web UI is the React PWA at the main domain.
Route::get('/', fn () => response()->json(['name' => config('app.name')]));
