<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\Rejection;
use App\Models\Request as InvoiceRequest;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Authoritative state machine for invoice requests.
 *
 * Mirrors src/context/RequestsContext.jsx exactly (status literals, reasons,
 * legal-gate logic). All methods return:
 *   ['ok' => true]                                        on success
 *   ['ok' => false, 'reason' => '<vietnamese verbatim>']  on guard fail
 *
 * Status literals (FE source of truth):
 *   Nháp, Chờ duyệt, Đã duyệt, Đã xuất HĐ, Từ chối, Trả lại bổ sung
 */
class RequestStateMachine
{
    public const DRAFT     = 'Nháp';
    public const PENDING   = 'Chờ duyệt';
    public const APPROVED  = 'Đã duyệt';
    public const EXPORTED  = 'Đã xuất HĐ';
    public const REJECTED  = 'Từ chối';
    public const RETURNED  = 'Trả lại bổ sung';

    /**
     * Allowed transitions: source => [targets].
     * Used by unit test to lock the matrix in place.
     */
    public const TRANSITIONS = [
        self::DRAFT    => [self::PENDING],
        self::PENDING  => [self::DRAFT, self::APPROVED, self::REJECTED, self::RETURNED],
        self::APPROVED => [self::EXPORTED],
        self::RETURNED => [self::PENDING, self::EXPORTED], // FE allows export from Trả lại bổ sung too
        self::EXPORTED => [],
        self::REJECTED => [],
    ];

    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    /** Nháp|Trả lại bổ sung → Chờ duyệt. */
    public function submit(InvoiceRequest $req): array
    {
        if (! in_array($req->status, [self::DRAFT, self::RETURNED], true)) {
            return ['ok' => false, 'reason' => 'Chỉ gửi duyệt được khi đang Nháp hoặc Trả lại bổ sung'];
        }
        $req->forceFill([
            'status' => self::PENDING,
            'submitted_at' => now(),
        ])->save();

        return ['ok' => true];
    }

    /** Chờ duyệt → Nháp (creator-only — caller enforces). */
    public function recall(InvoiceRequest $req, ?User $actor = null): array
    {
        if ($req->status !== self::PENDING) {
            return ['ok' => false, 'reason' => 'Chỉ được thu hồi khi đang Chờ duyệt'];
        }
        if ($actor && $req->created_by_id && (int) $actor->id !== (int) $req->created_by_id) {
            return ['ok' => false, 'reason' => 'Chỉ người tạo mới được thu hồi'];
        }
        $req->forceFill([
            'status' => self::DRAFT,
            'recalled_at' => now(),
        ])->save();

        return ['ok' => true];
    }

    /**
     * Chờ duyệt → Đã duyệt. Enforces legal gate (FE rule, OR-logic):
     *   legalComplete  = total === 0 || checked >= total
     *   commitmentValid = hasCommitment && deadline >= today
     *   allow = legalComplete || commitmentValid
     */
    public function approve(InvoiceRequest $req, User $approver, array $meta): array
    {
        if ($req->status !== self::PENDING) {
            return ['ok' => false, 'reason' => 'Chỉ duyệt được khi đang Chờ duyệt'];
        }

        if (! $this->passesLegalGate($req)) {
            return ['ok' => false, 'reason' => 'Hồ sơ pháp lý thiếu và không có cam kết bổ sung hợp lệ'];
        }

        DB::transaction(function () use ($req, $approver, $meta): void {
            Approval::updateOrCreate(
                ['request_id' => $req->id],
                [
                    'approved_by_id' => $approver->id,
                    'approved_at' => now(),
                    'accounting_ref_no' => $meta['accountingRefNo'],
                    'account_revenue' => $meta['accountRevenue'] ?? '5113',
                    'account_tax' => $meta['accountTax'] ?? '33311',
                    'account_receivable' => $meta['accountReceivable'] ?? '131',
                    'approval_note' => $meta['approvalNote'] ?? null,
                    'signature_snapshot' => [
                        'name' => $approver->name,
                        'role' => $approver->role,
                        'department' => $approver->department,
                        'signed_at' => now()->toIso8601String(),
                    ],
                ]
            );
            $req->forceFill(['status' => self::APPROVED])->save();
        });

        return ['ok' => true];
    }

    /** Chờ duyệt → Từ chối. */
    public function reject(InvoiceRequest $req, User $actor, string $reason): array
    {
        if ($req->status !== self::PENDING) {
            return ['ok' => false, 'reason' => 'Chỉ từ chối được khi đang Chờ duyệt'];
        }
        if (trim($reason) === '') {
            return ['ok' => false, 'reason' => 'Vui lòng nhập lý do từ chối'];
        }

        DB::transaction(function () use ($req, $actor, $reason): void {
            Rejection::create([
                'request_id' => $req->id,
                'kind' => 'reject',
                'reason' => $reason,
                'by_id' => $actor->id,
                'at' => now(),
            ]);
            $req->forceFill([
                'status' => self::REJECTED,
                'reject_reason' => $reason,
            ])->save();
        });

        return ['ok' => true];
    }

    /** Chờ duyệt → Trả lại bổ sung. */
    public function returnForSupplement(InvoiceRequest $req, User $actor, string $reason): array
    {
        if ($req->status !== self::PENDING) {
            return ['ok' => false, 'reason' => 'Chỉ trả lại được khi đang Chờ duyệt'];
        }
        if (trim($reason) === '') {
            return ['ok' => false, 'reason' => 'Vui lòng nhập lý do trả lại'];
        }

        DB::transaction(function () use ($req, $actor, $reason): void {
            Rejection::create([
                'request_id' => $req->id,
                'kind' => 'return',
                'reason' => $reason,
                'by_id' => $actor->id,
                'at' => now(),
            ]);
            $req->forceFill([
                'status' => self::RETURNED,
                'return_reason' => $reason,
            ])->save();
        });

        return ['ok' => true];
    }

    /** FE rule: legalComplete || commitmentValid. */
    public function passesLegalGate(InvoiceRequest $req): bool
    {
        $total = (int) $req->legal_total;
        $checked = (int) $req->legal_checked;
        $legalComplete = $total === 0 || $checked >= $total;

        $deadline = $req->commitment_deadline;
        $today = Carbon::today();
        $commitmentValid = (bool) $req->has_commitment
            && $deadline !== null
            && Carbon::parse($deadline)->gte($today);

        return $legalComplete || $commitmentValid;
    }
}
