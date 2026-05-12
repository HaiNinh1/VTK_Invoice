<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RevenueCenter;
use Illuminate\Http\Request;

class RevenueCenterController extends Controller
{
    /**
     * List revenue centers for picker UIs.
     * Open to any authenticated user (consistent with catalog reads).
     */
    public function index(Request $request)
    {
        $query = RevenueCenter::query()->orderBy('code');

        if ($search = $request->input('search')) {
            $query->where(function ($builder) use ($search) {
                $builder->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) min(200, max(1, (int) $request->input('per_page', 50)));

        $paginator = $query->paginate($perPage);

        // Return a flat shape \u2014 small reference table, no Resource overhead needed.
        $paginator->getCollection()->transform(function (RevenueCenter $rc) {
            return [
                'id' => $rc->id,
                'code' => $rc->code,
                'name' => $rc->name,
                'manager_user_id' => $rc->manager_user_id,
            ];
        });

        return $paginator;
    }
}
