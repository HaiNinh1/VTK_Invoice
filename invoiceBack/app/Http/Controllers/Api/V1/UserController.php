<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Lite user listing for picker UIs (project managers, assignees, etc.).
     * Open to any authenticated user. Returns only non-sensitive identity fields
     * \u2014 no email, phone, password, tokens.
     */
    public function index(Request $request)
    {
        $query = User::query()
            ->where('is_active', true)
            ->orderBy('name');

        if ($search = $request->input('search')) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->role($role); // spatie scope
        }

        if ($rc = $request->input('revenue_center_id')) {
            $query->where('revenue_center_id', (int) $rc);
        }

        if ($dept = $request->input('department_id')) {
            $query->where('department_id', (int) $dept);
        }

        $perPage = (int) min(200, max(1, (int) $request->input('per_page', 50)));

        $paginator = $query->paginate($perPage);

        $paginator->getCollection()->transform(function (User $u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'employee_code' => $u->employee_code,
                'department_id' => $u->department_id,
                'revenue_center_id' => $u->revenue_center_id,
            ];
        });

        return $paginator;
    }
}
