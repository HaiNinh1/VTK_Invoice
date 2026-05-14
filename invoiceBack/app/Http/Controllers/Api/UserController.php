<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // Exact strings matching FE.
    public const ROLES = ['employee', 'manager', 'accountant', 'admin'];

    public const DEPARTMENTS = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'DL', 'DDL', 'TC', 'IT'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        return UserResource::collection(User::orderBy('id')->get());
    }

    public function store(Request $request): UserResource
    {
        $this->authorize('create', User::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(self::ROLES)],
            'department' => ['required', Rule::in(self::DEPARTMENTS)],
            'phone' => ['nullable', 'string', 'max:30'],
            'title' => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::create($data);

        return new UserResource($user);
    }

    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);

        return new UserResource($user);
    }

    public function update(Request $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'email' => ['sometimes', 'email', 'max:120', 'unique:users,email,' . $user->id],
            'password' => ['sometimes', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(self::ROLES)],
            'department' => ['sometimes', Rule::in(self::DEPARTMENTS)],
            'phone' => ['nullable', 'string', 'max:30'],
            'title' => ['nullable', 'string', 'max:120'],
        ]);

        $user->update($data);

        return new UserResource($user->fresh());
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        if ($request->user()->id === $user->id) {
            return response()->json([
                'ok' => false,
                'reason' => 'Không thể xoá chính bạn',
            ], 422);
        }

        $user->delete();

        return response()->json(['ok' => true]);
    }
}
