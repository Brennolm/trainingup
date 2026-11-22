<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Plan;
use App\Models\User;
use App\Services\EmailVerificationService;
use App\Support\LegalConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request, EmailVerificationService $verification): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = new User($request->safe()->only(['name', 'email', 'password', 'birth_date']));
            $user->plan()->associate(Plan::free());
            $user->save();

            // LGPD: record which version of each document was accepted, when and from where.
            LegalConsent::record($user, $request);

            return $user;
        });

        // Stay signed in by default (docs/DECISIONS.md).
        Auth::guard('web')->login($user, remember: true);
        $request->session()->regenerate();

        $sent = $verification->send($user);

        return (new UserResource($user->load('plan')))
            ->additional(['meta' => ['verification_email_sent' => $sent]])
            ->response()
            ->setStatusCode(201);
    }
}
