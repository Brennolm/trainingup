<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class MeController extends Controller
{
    /**
     * The signed-in user, or `data: null` for guests. Guests get 200 (not 401) because the SPA
     * asks on every page load; a 401 would show up as an error in the browser console.
     */
    public function __invoke(): JsonResponse|UserResource
    {
        $user = Auth::guard('sanctum')->user();

        if (! $user) {
            return response()->json(['data' => null]);
        }

        return new UserResource($user->load('plan'));
    }
}
