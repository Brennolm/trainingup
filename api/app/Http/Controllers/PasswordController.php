<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

/** Profile → Segurança: change the password, or create one for Google-only accounts. */
class PasswordController extends Controller
{
    public function update(Request $request): UserResource
    {
        $user = $request->user();
        $hasPassword = $user->password !== null;

        $request->validate([
            'current_password' => $hasPassword ? ['required', 'string', 'current_password:web'] : ['nullable'],
            'password' => ['required', 'string', 'max:255', 'confirmed', Password::defaults()],
        ]);

        $user->forceFill(['password' => $request->input('password')])->save();

        return new UserResource($user->load('plan'));
    }
}
