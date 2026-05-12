<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserSignature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SignatureController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $signature = $request->user()->signature()->first();

        if (! $signature) {
            return response()->json(['message' => 'Signature not found.'], 404);
        }

        return response()->json(['data' => $this->payload($signature)]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'method' => ['required', Rule::in(['draw', 'text', 'upload'])],
            'file' => ['required_if:method,draw,upload', 'file', 'mimes:png,jpg,jpeg', 'max:2048'],
            'text' => ['required_if:method,text', 'string', 'max:255'],
            'font_family' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();
        $path = "signatures/{$user->id}.txt";

        if ($request->hasFile('file')) {
            $path = $request->file('file')->storeAs('signatures', $user->id.'.'.$request->file('file')->extension());
        } else {
            Storage::disk('local')->put($path, $validated['text'] ?? $user->name);
        }

        $signature = UserSignature::updateOrCreate(
            ['user_id' => $user->id],
            [
                'method' => $validated['method'],
                'data_path' => $path,
                'font_family' => $validated['font_family'] ?? null,
            ]
        );

        return response()->json(['data' => $this->payload($signature)]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $signature = $request->user()->signature()->first();

        if ($signature) {
            Storage::disk('local')->delete($signature->data_path);
            $signature->delete();
        }

        return response()->json(null, 204);
    }

    private function payload(UserSignature $signature): array
    {
        return [
            'id' => $signature->id,
            'method' => $signature->method,
            'data_path' => $signature->data_path,
            'font_family' => $signature->font_family,
            'created_at' => optional($signature->created_at)->toIso8601String(),
            'updated_at' => optional($signature->updated_at)->toIso8601String(),
        ];
    }
}
