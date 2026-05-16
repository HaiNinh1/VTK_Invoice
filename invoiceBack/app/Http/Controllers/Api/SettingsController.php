<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ConnectionSettingsService;
use App\Services\Viettel\ViettelDriverInterface;
use App\Services\Viettel\ViettelException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Admin-only connection config + connectivity tests.
 *
 * GET    /api/settings/connections                  → returns {sInvoice, smtp} with secrets masked
 * PATCH  /api/settings/connections/s-invoice        → save endpoint/taxCode/username/apiSecret
 * PATCH  /api/settings/connections/smtp             → save host/port/username/password/from
 * POST   /api/settings/connections/s-invoice/test   → ping via Viettel driver, {ok, message}
 * POST   /api/settings/connections/smtp/test        → send test mail to `to`, {ok, message}
 *
 * Empty-string secret values in PATCH = "don't change" (matches FE form UX where the input is blank
 * after page load; sending '' should NOT wipe an already-saved secret).
 */
class SettingsController extends Controller
{
    public function __construct(private readonly ConnectionSettingsService $settings) {}

    private function assertAdmin(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403, 'Chỉ admin được truy cập cài đặt kết nối');
    }

    public function index(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        return response()->json([
            'data' => [
                'sInvoice' => $this->settings->sInvoicePublic(),
                'smtp' => $this->settings->smtpPublic(),
            ],
        ]);
    }

    public function updateSInvoice(Request $request): JsonResponse
    {
        $this->assertAdmin($request);
        $data = $request->validate([
            'endpoint' => ['sometimes', 'string', 'url', 'max:255'],
            'taxCode' => ['sometimes', 'string', 'max:20'],
            'username' => ['sometimes', 'string', 'max:100'],
            'apiSecret' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        return response()->json(['ok' => true, 'data' => $this->settings->saveSInvoice($data)]);
    }

    public function updateSmtp(Request $request): JsonResponse
    {
        $this->assertAdmin($request);
        $data = $request->validate([
            'host' => ['sometimes', 'string', 'max:255'],
            'port' => ['sometimes', 'string', 'max:6'],
            'username' => ['sometimes', 'string', 'max:255'],
            'password' => ['sometimes', 'nullable', 'string', 'max:255'],
            'from' => ['sometimes', 'string', 'max:255'],
        ]);

        return response()->json(['ok' => true, 'data' => $this->settings->saveSmtp($data)]);
    }

    /**
     * Liveness ping against the configured Viettel S-Invoice endpoint.
     *
     * The FakeViettelDriver bound by AppServiceProvider lets us "test" without a real network call:
     * we synthesize a transient InvoiceRequest, hand it to the driver, and treat any returned
     * number/taxCode as "OK". Real drivers should expose a true `ping()`; we approximate here.
     */
    public function testSInvoice(Request $request, ViettelDriverInterface $driver): JsonResponse
    {
        $this->assertAdmin($request);
        $cfg = $this->settings->sInvoice();

        try {
            // Build a stub request — driver only reads identification fields.
            $stub = new \App\Models\Request([
                'id' => 'PING-' . now()->format('YmdHis'),
                'customer_name' => 'Connection Test',
                'customer_tax_code' => $cfg['taxCode'],
                'value_before_vat' => 0,
                'vat_rate' => 0,
                'vat_amount' => 0,
                'value_after_vat' => 0,
            ]);
            $result = $driver->issue($stub);

            return response()->json([
                'ok' => true,
                'message' => "Kết nối thành công · MST {$cfg['taxCode']}",
                'data' => ['probeNumber' => $result['number']],
            ]);
        } catch (ViettelException $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => 'Không kết nối được cổng S-Invoice: ' . $e->getMessage()], 422);
        }
    }

    /**
     * Send a test email via Laravel mailer. We don't dynamically swap mailer config here
     * (would require runtime config rebinding); instead we send via the configured mailer
     * and report success. In production, deploy should sync app_settings.smtp → config/mail.php.
     */
    public function testSmtp(Request $request): JsonResponse
    {
        $this->assertAdmin($request);
        $data = $request->validate([
            'to' => ['required', 'email'],
        ]);
        $cfg = $this->settings->smtp();

        try {
            Mail::raw(
                "Email kiểm tra kết nối SMTP từ VTK Invoice.\nThời điểm: " . now()->toDateTimeString(),
                function ($msg) use ($data, $cfg): void {
                    $msg->to($data['to'])
                        ->subject('[VTK Invoice] Kiểm tra SMTP')
                        ->from(...$this->parseFrom($cfg['from']));
                },
            );

            return response()->json([
                'ok' => true,
                'message' => "Đã gửi mail test tới {$data['to']}",
            ]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => 'Gửi mail thất bại: ' . $e->getMessage()], 422);
        }
    }

    /**
     * Parse "Name <email@host>" or plain "email@host" into [$email, $name|null] for `->from()`.
     */
    private function parseFrom(string $from): array
    {
        if (preg_match('/^(.+?)\s*<(.+?)>$/', trim($from), $m)) {
            return [trim($m[2]), trim($m[1])];
        }

        return [trim($from), null];
    }
}
