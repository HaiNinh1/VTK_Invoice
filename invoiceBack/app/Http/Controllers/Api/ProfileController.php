<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(Request $request): UserResource
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email,' . $user->id],
        ]);

        $user->update($data);

        return new UserResource($user);
    }

    public function uploadSignature(Request $request): JsonResponse
    {
        $request->validate([
            'signature' => ['required', 'file', 'mimes:png,jpg,jpeg', 'max:1024'], // 1MB
        ]);

        $user = $request->user();

        // Remove previous signature if any.
        if ($user->signature_path && Storage::disk('public')->exists($user->signature_path)) {
            Storage::disk('public')->delete($user->signature_path);
        }

        $path = $request->file('signature')->store('signatures', 'public');

        $user->update([
            'signature_path' => $path,
            'has_signature' => true,
        ]);

        return response()->json([
            'ok' => true,
            'signaturePath' => $path,
            'user' => new UserResource($user->fresh()),
        ]);
    }
}
