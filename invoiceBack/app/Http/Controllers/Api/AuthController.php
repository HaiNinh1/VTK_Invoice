<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        $token = $user->createToken('web-' . now()->timestamp)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        // FE field names: currentPwd / newPwd / confirmPwd
        $data = $request->validate([
            'currentPwd' => ['required', 'string'],
            'newPwd' => ['required', 'string', 'min:8'],
            'confirmPwd' => ['required', 'string'],
        ], [
            'currentPwd.required' => 'Vui lòng nhập đủ 3 trường mật khẩu',
            'newPwd.required' => 'Vui lòng nhập đủ 3 trường mật khẩu',
            'confirmPwd.required' => 'Vui lòng nhập đủ 3 trường mật khẩu',
            'newPwd.min' => 'Mật khẩu mới phải có tối thiểu 8 ký tự',
        ]);

        if ($data['newPwd'] !== $data['confirmPwd']) {
            throw ValidationException::withMessages([
                'confirmPwd' => ['Mật khẩu xác nhận không khớp'],
            ]);
        }

        $user = $request->user();

        if (! Hash::check($data['currentPwd'], $user->password)) {
            throw ValidationException::withMessages([
                'currentPwd' => ['Mật khẩu hiện tại không đúng'],
            ]);
        }

        $user->password = $data['newPwd']; // 'hashed' cast handles hashing
        $user->save();

        return response()->json(['ok' => true]);
    }
}
