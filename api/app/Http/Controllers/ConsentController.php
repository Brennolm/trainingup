<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\Consent;
use App\Support\LegalConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Profile → Privacidade → Meus consentimentos; accepting updated legal texts. */
class ConsentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $consents = $request->user()->consents()->latest('accepted_at')->latest('id')->get();

        return response()->json(['data' => $consents->map(fn (Consent $c) => [
            'type' => $c->type->value,
            'version' => $c->version,
            'accepted_at' => $c->accepted_at->toIso8601String(),
            'ip_address' => $c->ip_address,
        ])]);
    }

    /** Accepts the current versions of the Terms and the Privacy Policy. */
    public function store(Request $request): UserResource
    {
        $request->validate(['accept_terms' => ['accepted']]);

        $user = $request->user();
        if (LegalConsent::isOutdated($user)) {
            LegalConsent::record($user, $request);
        }

        return new UserResource($user->load('plan'));
    }
}
