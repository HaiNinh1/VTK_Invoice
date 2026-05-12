<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->signature()->exists()) {
            return response()->json(['error' => 'signature_required'], 428);
        }

        return $next($request);
    }
}
