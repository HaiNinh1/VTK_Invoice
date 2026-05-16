<?php

namespace App\Services\Viettel;

use App\Models\Request as InvoiceRequest;
use App\Models\SInvoice;

/**
 * In-process Viettel S-Invoice mock. Generates deterministic-looking numbers
 * (K26TYY + 7 digits) and tax codes (4A2B + 4 digits) and can be flipped to
 * always-fail mode via {@see self::$failNext} for tests / Lỗi flow demos.
 *
 * Test hooks:
 *   FakeViettelDriver::failNext('Mã CQT đã tồn tại') → next issue() throws
 *   FakeViettelDriver::reset()                       → clear pending failure
 */
class FakeViettelDriver implements ViettelDriverInterface
{
    private static ?string $failReason = null;

    public static function failNext(string $reason = 'Lỗi kết nối S-Invoice'): void
    {
        self::$failReason = $reason;
    }

    public static function reset(): void
    {
        self::$failReason = null;
    }

    public function issue(InvoiceRequest $request): array
    {
        if (self::$failReason !== null) {
            $reason = self::$failReason;
            self::$failReason = null;
            throw new ViettelException($reason);
        }

        return [
            'number' => $this->generateNumber(),
            'taxCode' => $this->generateTaxCode(),
            'rawResponse' => [
                'gateway' => 'fake-viettel',
                'requestId' => $request->id,
                'issuedAt' => now()->toIso8601String(),
            ],
        ];
    }

    private function generateNumber(): string
    {
        // K26TYY + 7 digits, monotonic-ish based on existing rows + random suffix.
        $base = SInvoice::query()->whereNotNull('s_invoice_number')->count() + 1;
        do {
            $candidate = 'K26TYY'.str_pad((string) ($base + random_int(0, 99)), 7, '0', STR_PAD_LEFT);
            $base++;
        } while (SInvoice::where('s_invoice_number', $candidate)->exists());
        return $candidate;
    }

    private function generateTaxCode(): string
    {
        return '4A2B'.str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
    }
}
