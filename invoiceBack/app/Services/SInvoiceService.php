<?php

namespace App\Services;

use App\Models\Request as InvoiceRequest;
use App\Models\SInvoice;
use App\Services\Viettel\ViettelDriverInterface;
use App\Services\Viettel\ViettelException;
use Illuminate\Support\Facades\DB;

/**
 * Orchestrates the export flow: validate status, call driver, persist SInvoice,
 * transition request to "Đã xuất HĐ", fire notification. All in one DB transaction.
 *
 * Returns the FE-shape envelope {ok, sInvoiceNumber?, reason?} so callers can
 * pass directly through to JSON responses.
 */
class SInvoiceService
{
    public function __construct(
        private readonly ViettelDriverInterface $driver,
        private readonly NotificationDispatcher $notifications,
    ) {}

    /**
     * @return array{ok: bool, sInvoiceNumber?: ?string, reason?: string}
     */
    public function export(InvoiceRequest $request): array
    {
        if (! in_array($request->status, ['Đã duyệt', 'Trả lại bổ sung'], true)) {
            return ['ok' => false, 'reason' => 'Chỉ xuất được khi đã duyệt', 'sInvoiceNumber' => null];
        }

        try {
            $payload = $this->driver->issue($request);
        } catch (ViettelException $e) {
            return $this->persistFailure($request, $e->getMessage());
        }

        return DB::transaction(function () use ($request, $payload) {
            $sInvoice = SInvoice::updateOrCreate(
                ['request_id' => $request->id],
                [
                    's_invoice_number' => $payload['number'],
                    's_invoice_tax_code' => $payload['taxCode'],
                    'status' => 'Thành công',
                    'error_message' => null,
                    'gateway_response_json' => $payload['rawResponse'] ?? null,
                    'exported_at' => now(),
                    'last_synced_at' => now(),
                ],
            );
            $request->forceFill(['status' => 'Đã xuất HĐ'])->save();
            $request->setRelation('sInvoice', $sInvoice);
            $this->notifications->onSInvoiceIssued($request, 'Thành công');
            return ['ok' => true, 'sInvoiceNumber' => $sInvoice->s_invoice_number];
        });
    }

    /**
     * @return array{ok: bool, sInvoiceNumber?: ?string, reason?: string}
     */
    public function retry(InvoiceRequest $request): array
    {
        $existing = $request->sInvoice;
        if (! $existing || $existing->status !== 'Lỗi') {
            return ['ok' => false, 'reason' => 'Chỉ retry được khi đang ở trạng thái Lỗi', 'sInvoiceNumber' => null];
        }

        try {
            $payload = $this->driver->issue($request);
        } catch (ViettelException $e) {
            return $this->persistFailure($request, $e->getMessage(), $existing);
        }

        return DB::transaction(function () use ($request, $payload, $existing) {
            $existing->forceFill([
                's_invoice_number' => $payload['number'],
                's_invoice_tax_code' => $payload['taxCode'],
                'status' => 'Thành công',
                'error_message' => null,
                'gateway_response_json' => $payload['rawResponse'] ?? null,
                'last_synced_at' => now(),
            ])->save();
            // Status remains "Đã xuất HĐ" — that was set on the original failure.
            if ($request->status !== 'Đã xuất HĐ') {
                $request->forceFill(['status' => 'Đã xuất HĐ'])->save();
            }
            $request->setRelation('sInvoice', $existing);
            $this->notifications->onSInvoiceIssued($request, 'Thành công');
            return ['ok' => true, 'sInvoiceNumber' => $existing->s_invoice_number];
        });
    }

    /** Webhook ingress: provider pushes async status updates by request id. */
    public function applyWebhook(string $requestId, array $payload): array
    {
        $request = InvoiceRequest::find($requestId);
        if (! $request) {
            return ['ok' => false, 'reason' => 'Không tìm thấy đề nghị'];
        }

        $status = $payload['status'] ?? null;
        if (! in_array($status, ['Đang xử lý', 'Thành công', 'Lỗi'], true)) {
            return ['ok' => false, 'reason' => 'Trạng thái không hợp lệ'];
        }

        return DB::transaction(function () use ($request, $payload, $status) {
            $sInvoice = SInvoice::updateOrCreate(
                ['request_id' => $request->id],
                [
                    's_invoice_number' => $payload['sInvoiceNumber'] ?? null,
                    's_invoice_tax_code' => $payload['sInvoiceTaxCode'] ?? null,
                    'status' => $status,
                    'error_message' => $payload['error'] ?? null,
                    'gateway_response_json' => $payload,
                    'exported_at' => $request->sInvoice?->exported_at ?? now(),
                    'last_synced_at' => now(),
                ],
            );
            if ($request->status !== 'Đã xuất HĐ') {
                $request->forceFill(['status' => 'Đã xuất HĐ'])->save();
            }
            $request->setRelation('sInvoice', $sInvoice);
            $this->notifications->onSInvoiceIssued($request, $status, $payload['error'] ?? null);
            return ['ok' => true];
        });
    }

    private function persistFailure(InvoiceRequest $request, string $reason, ?SInvoice $existing = null): array
    {
        DB::transaction(function () use ($request, $reason, $existing) {
            $row = SInvoice::updateOrCreate(
                ['request_id' => $request->id],
                [
                    's_invoice_number' => $existing?->s_invoice_number,
                    's_invoice_tax_code' => $existing?->s_invoice_tax_code,
                    'status' => 'Lỗi',
                    'error_message' => $reason,
                    'gateway_response_json' => null,
                    'exported_at' => $existing?->exported_at ?? now(),
                    'last_synced_at' => now(),
                ],
            );
            // FE convention: even on Lỗi, request transitions to "Đã xuất HĐ" so the
            // row appears in the S-Invoice tab where retry is offered.
            if ($request->status !== 'Đã xuất HĐ') {
                $request->forceFill(['status' => 'Đã xuất HĐ'])->save();
            }
            $request->setRelation('sInvoice', $row);
            $this->notifications->onSInvoiceIssued($request, 'Lỗi', $reason);
        });
        return ['ok' => false, 'reason' => $reason, 'sInvoiceNumber' => null];
    }
}
