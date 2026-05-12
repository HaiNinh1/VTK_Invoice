<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InvoiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $cacheKey = "dashboard:{$user->id}:".implode(',', $user->getRoleNames()->all());

        return response()->json([
            'data' => Cache::remember($cacheKey, 30, function () use ($user) {
                $base = InvoiceRequest::query()->visibleTo($user);
                $pending = (clone $base)->whereIn('status', ['pending', 'pending_vpgd'])->count();

                return [
                    'scope' => $this->scopeFor($user),
                    'total' => (clone $base)->count(),
                    'draft' => (clone $base)->where('status', 'draft')->count(),
                    'pending' => $pending,
                    'returned' => (clone $base)->where('status', 'returned')->count(),
                    'approved' => (clone $base)->where('status', 'approved')->count(),
                    'rejected' => (clone $base)->where('status', 'rejected')->count(),
                    'by_status' => (clone $base)
                        ->selectRaw('status, count(*) as total')
                        ->groupBy('status')
                        ->pluck('total', 'status')
                        ->mapWithKeys(fn ($total, $status) => [str_replace('_', '-', $status) => $total]),
                ];
            }),
        ]);
    }

    private function scopeFor($user): string
    {
        if ($user->hasAnyRoleName(['admin', 'accountant', 'director'])) {
            return 'company';
        }

        if ($user->hasRole('manager')) {
            return 'revenue-center';
        }

        return 'own';
    }
}
