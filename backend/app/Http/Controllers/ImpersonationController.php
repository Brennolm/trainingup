<?php

namespace App\Http\Controllers;

use App\Services\Impersonation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** "Sair" on the "Você está vendo como…" bar: back to the admin's own account. */
class ImpersonationController extends Controller
{
    public function destroy(Request $request, Impersonation $impersonation): JsonResponse
    {
        $impersonation->stop($request);

        return response()->json(['message' => __('admin.impersonation.stopped')]);
    }
}
