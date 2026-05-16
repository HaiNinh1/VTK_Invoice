<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SInvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request as HttpRequest;

/**
 * Receives async push notifications from Viettel S-Invoice provider.
 *
 * Auth: HMAC-SHA256 over raw body, comparing X-Signature header against
 * config('services.viettel.webhook_secret'). Constant-time compared.
 *
 * Expected payload:
 *   {
 *     "requestId": "DN-2026-00101",
 *     "status": "Thành công" | "Lỗi" | "Đang xử lý",
 *     "sInvoiceNumber": "K26TYY0000123",
 *     "sInvoiceTaxCode": "4A2B1000",
 *     "error": "...optional, when status=Lỗi"
 *   }
 */
class ViettelWebhookController extends Controller
{
    public function __construct(private readonly SInvoiceService $service) {}

    public function handle(HttpRequest $request): JsonResponse
    {
        $secret = (string) config('services.viettel.webhook_secret', '');
        if ($secret === '') {
            return response()->json(['ok' => false, 'reason' => 'Webhook secret chưa được cấu hình'], 503);
        }

        $signature = (string) $request->header('X-Signature', '');
        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        if ($signature === '' || ! hash_equals($expected, $signature)) {
            return response()->json(['ok' => false, 'reason' => 'Chữ ký không hợp lệ'], 401);
        }

        $payload = $request->validate([
            'requestId' => ['required', 'string'],
            'status' => ['required', 'string'],
            'sInvoiceNumber' => ['nullable', 'string'],
            'sInvoiceTaxCode' => ['nullable', 'string'],
            'error' => ['nullable', 'string'],
        ]);

        $result = $this->service->applyWebhook($payload['requestId'], $payload);
        return response()->json($result, $result['ok'] ? 200 : 422);
    }
}
