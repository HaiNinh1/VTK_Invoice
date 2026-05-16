<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationSetting;
use App\Models\Request as InvoiceRequest;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Centralized notification creation. Mirrors src/context/NotificationsContext.jsx
 * derivation rules but persists rows server-side so they survive page reloads.
 *
 * Kinds (9 total — exact FE keys):
 *   pendingApproval  → accountant/admin when status=Chờ duyệt
 *   approved         → creator when status=Đã duyệt|Đã xuất HĐ
 *   rejected         → creator when status=Từ chối
 *   returned         → creator when status=Trả lại bổ sung
 *   exportSuccess    → accountant/admin when sInvoiceStatus≠Lỗi
 *   exportError      → accountant/admin when sInvoiceStatus=Lỗi
 *   legalDueSoon     → creator when 0 ≤ daysToDeadline ≤ 3
 *   commitmentOverdue→ creator when daysToDeadline < 0
 *   system           → manual push
 */
class NotificationDispatcher
{
    public function onRequestStatusChanged(InvoiceRequest $req, ?string $previous): void
    {
        switch ($req->status) {
            case 'Chờ duyệt':
                $this->fanOutToRoles($req, 'pendingApproval',
                    "Đề nghị mới chờ duyệt: {$req->id}",
                    "{$req->customer_name} — ".$this->vnd($req->value_after_vat),
                    ['accountant', 'admin']);
                break;

            case 'Đã duyệt':
                $this->toUser($req->created_by_id, 'approved',
                    "Đề nghị {$req->id} đã được duyệt",
                    'Đề nghị xuất hóa đơn đã được kế toán duyệt',
                    $req);
                break;

            case 'Từ chối':
                $this->toUser($req->created_by_id, 'rejected',
                    "Đề nghị {$req->id} bị từ chối",
                    'Lý do: '.($req->reject_reason ?? '—'),
                    $req);
                break;

            case 'Trả lại bổ sung':
                $this->toUser($req->created_by_id, 'returned',
                    "Đề nghị {$req->id} bị trả lại bổ sung",
                    'Lý do: '.($req->return_reason ?? '—'),
                    $req);
                break;
        }
    }

    /** Called from SInvoice flow after issuance (Step 6 wires this). */
    public function onSInvoiceIssued(InvoiceRequest $req, string $status, ?string $error = null): void
    {
        if ($status === 'Lỗi') {
            $this->fanOutToRoles($req, 'exportError',
                "Xuất hóa đơn {$req->id} thất bại",
                $error ?? 'Lỗi kết nối S-Invoice',
                ['accountant', 'admin']);
        } else {
            $number = $req->sInvoice?->s_invoice_number ?? $req->id;
            $this->fanOutToRoles($req, 'exportSuccess',
                "Xuất hóa đơn {$number} thành công",
                "{$req->customer_name} — ".$this->vnd($req->value_after_vat),
                ['accountant', 'admin']);
        }
    }

    /** Returns count of rows created — used by scheduled command output. */
    public function dispatchDeadlineNotifications(): int
    {
        $today = Carbon::today();
        $count = 0;

        $candidates = InvoiceRequest::query()
            ->where('has_commitment', true)
            ->whereNotNull('commitment_deadline')
            ->whereIn('status', ['Chờ duyệt', 'Đã duyệt', 'Trả lại bổ sung'])
            ->get();

        foreach ($candidates as $req) {
            $deadline = Carbon::parse($req->commitment_deadline);
            $days = (int) $today->diffInDays($deadline, false); // negative = overdue

            if ($days < 0) {
                if ($this->toUserOncePerDay($req->created_by_id, 'commitmentOverdue', $req,
                    "Hồ sơ {$req->id} đã quá hạn bổ sung",
                    'Hạn: '.$deadline->format('d/m/Y').' (quá '.abs($days).' ngày)')) {
                    $count++;
                }
            } elseif ($days >= 0 && $days <= 3) {
                if ($this->toUserOncePerDay($req->created_by_id, 'legalDueSoon', $req,
                    "Hồ sơ {$req->id} sắp đến hạn bổ sung",
                    'Hạn: '.$deadline->format('d/m/Y').' (còn '.$days.' ngày)')) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /** Pushes a manual system event to all users matching given roles. */
    public function pushSystem(string $title, string $description, array $roles = ['employee', 'manager', 'accountant', 'admin']): int
    {
        $users = User::whereIn('role', $roles)->get();
        $count = 0;
        foreach ($users as $u) {
            if ($this->settingEnabled($u->id, 'system')) {
                $this->create($u->id, 'system', $title, $description, null);
                $count++;
            }
        }
        return $count;
    }

    /** Returns or creates user's settings map, defaulting to FE defaults. */
    public function settingsForUser(int $userId): array
    {
        $existing = NotificationSetting::where('user_id', $userId)
            ->pluck('enabled', 'key')
            ->all();

        $out = [];
        foreach (NotificationSetting::KINDS as $key) {
            $out[$key] = array_key_exists($key, $existing)
                ? (bool) $existing[$key]
                : NotificationSetting::DEFAULTS[$key];
        }
        return $out;
    }

    public function updateSettingsForUser(int $userId, array $patch): array
    {
        foreach ($patch as $key => $enabled) {
            if (! in_array($key, NotificationSetting::KINDS, true)) {
                continue;
            }
            NotificationSetting::updateOrCreate(
                ['user_id' => $userId, 'key' => $key],
                ['enabled' => (bool) $enabled],
            );
        }
        return $this->settingsForUser($userId);
    }

    // ─── internals ─────────────────────────────────────────────────────────

    private function fanOutToRoles(InvoiceRequest $req, string $kind, string $title, string $desc, array $roles): void
    {
        $users = User::whereIn('role', $roles)->get();
        foreach ($users as $u) {
            if (! $this->settingEnabled($u->id, $kind)) {
                continue;
            }
            $this->create($u->id, $kind, $title, $desc, $req);
        }
    }

    private function toUser(int $userId, string $kind, string $title, string $desc, ?InvoiceRequest $req): void
    {
        if (! $this->settingEnabled($userId, $kind)) {
            return;
        }
        $this->create($userId, $kind, $title, $desc, $req);
    }

    private function toUserOncePerDay(int $userId, string $kind, InvoiceRequest $req, string $title, string $desc): bool
    {
        $today = Carbon::today();
        $already = Notification::query()
            ->where('user_id', $userId)
            ->where('kind', $kind)
            ->where('created_at', '>=', $today)
            ->whereJsonContains('data_json->requestId', $req->id)
            ->exists();
        if ($already) {
            return false;
        }
        $this->toUser($userId, $kind, $title, $desc, $req);
        return true;
    }

    private function settingEnabled(int $userId, string $kind): bool
    {
        $row = NotificationSetting::where('user_id', $userId)->where('key', $kind)->first();
        if ($row) {
            return (bool) $row->enabled;
        }
        return NotificationSetting::DEFAULTS[$kind] ?? false;
    }

    private function create(int $userId, string $kind, string $title, string $desc, ?InvoiceRequest $req): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'kind' => $kind,
            'title' => $title,
            'description' => $desc,
            'data_json' => $req ? [
                'requestId' => $req->id,
                'contractId' => $req->contract_id,
                'to' => "/de-nghi/{$req->id}",
            ] : null,
            'created_at' => now(),
        ]);
    }

    private function vnd(float|int|string|null $value): string
    {
        if ($value === null) {
            return '—';
        }
        return number_format((float) $value, 0, ',', '.').' đ';
    }
}
