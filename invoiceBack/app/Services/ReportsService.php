<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Request as InvoiceRequest;
use App\Models\SInvoice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Aggregations for /api/reports/summary.
 *
 * Shape designed to feed both:
 *   - ViecCanLam.jsx AccountantReport tab (KPI tiles + byDepartment table)
 *   - SInvoice.jsx tab counts
 *   - DeNghi.jsx legal dossier stat cards (legalDossiers block)
 *
 * Department scoping mirrors FE rules:
 *   accountant/admin -> all departments
 *   manager          -> own department only
 *   employee         -> own requests only (createdBy)
 */
class ReportsService
{
    /**
     * Build full summary payload.
     *
     * @param  User         $user    Auth user used for scoping.
     * @param  string|null  $month   'YYYY-MM' or null/'all' for all months.
     * @param  string|null  $dept    Department code (acc/admin only) or null.
     */
    public function summary(User $user, ?string $month = null, ?string $dept = null): array
    {
        $month = ($month === '' || $month === 'all') ? null : $month;
        if ($month !== null && ! preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month = null;
        }

        $requests = $this->scopedRequests($user, $month, $dept);

        $totalRequests = $requests->count();
        $totalValue    = (int) $requests->sum('value_after_vat');
        $issuedValue   = (int) $requests->where('status', 'Đã xuất HĐ')->sum('value_after_vat');
        $pendingCount  = $requests->where('status', 'Chờ duyệt')->count();
        $rejectedCount = $requests->where('status', 'Từ chối')->count();

        $byDepartment = $requests
            ->groupBy('department')
            ->map(fn ($group, $key) => [
                'dept'  => (string) $key,
                'count' => $group->count(),
                'value' => (int) $group->sum('value_after_vat'),
            ])
            ->values()
            ->sortByDesc('value')
            ->values()
            ->all();

        $sInvoiceCounts = $this->sInvoiceCounts($user, $month, $dept);
        $legalDossiers  = $this->legalDossiers($user);

        return [
            'months'         => $this->availableMonths($user),
            'selectedMonth'  => $month ?? 'all',
            'selectedDept'   => $dept,
            'totalRequests'  => $totalRequests,
            'totalValue'     => $totalValue,
            'issuedValue'    => $issuedValue,
            'pendingCount'   => $pendingCount,
            'rejectedCount'  => $rejectedCount,
            'byDepartment'   => $byDepartment,
            'sInvoiceCounts' => $sInvoiceCounts,
            'legalDossiers'  => $legalDossiers,
        ];
    }

    /**
     * Available months derived from request.created_at, newest first.
     *
     * @return array<int, string>
     */
    public function availableMonths(User $user): array
    {
        $base = $this->baseRequestQuery($user);

        return $base
            ->selectRaw("SUBSTR(created_at, 1, 7) AS m")
            ->groupBy('m')
            ->orderByDesc('m')
            ->pluck('m')
            ->all();
    }

    private function sInvoiceCounts(User $user, ?string $month, ?string $dept): array
    {
        $requests = $this->scopedRequests($user, $month, $dept)
            ->where('status', 'Đã xuất HĐ');

        $reqIds = $requests->pluck('id');
        $sInvoices = SInvoice::query()->whereIn('request_id', $reqIds)->get()->keyBy('request_id');

        $dangXuLy = 0;
        $thanhCong = 0;
        $loi = 0;
        $tatCa = $reqIds->count();

        foreach ($reqIds as $rid) {
            $status = optional($sInvoices->get($rid))->status;
            if ($status === 'Lỗi')          { $loi++; }
            elseif ($status === 'Đang xử lý') { $dangXuLy++; }
            else                              { $thanhCong++; } // includes null
        }

        return [
            'dangXuLy'  => $dangXuLy,
            'thanhCong' => $thanhCong,
            'loi'       => $loi,
            'tatCa'     => $tatCa,
        ];
    }

    private function legalDossiers(User $user): array
    {
        // Department scope (no month filter — dossiers are a current-state view).
        $query = Contract::query();
        if (! $user->canSeeAllDepartments()) {
            $query->where('department', $user->department);
        }
        $contracts = $query->withCount('documents')->get();

        $rows = [];
        $totalC = $contracts->count();
        $completeC = 0;
        $sumPct = 0;

        foreach ($contracts as $c) {
            $total = 0;
            if ($total === 0) {
                // Compute on demand from invoice_types config matching service_type.
                $total = (int) DB::table('document_templates as t')
                    ->join('document_groups as g', 'g.id', '=', 't.document_group_id')
                    ->join('invoice_types as it', 'it.id', '=', 'g.invoice_type_id')
                    ->where('it.service_type', $c->service_type)
                    ->count();
            }
            $uploaded = min($total, (int) $c->documents_count);
            $pct = $total > 0 ? (int) round($uploaded / $total * 100) : 0;
            $sumPct += $pct;
            if ($pct === 100) { $completeC++; }
            $rows[] = [
                'id'             => $c->id,
                'contractNumber' => $c->contract_number,
                'customerName'   => $c->customer_name,
                'serviceType'    => $c->service_type,
                'signDate'       => optional($c->sign_date)->toDateString(),
                'total'          => $total,
                'uploaded'       => $uploaded,
                'pct'            => $pct,
            ];
        }

        return [
            'totalC'      => $totalC,
            'completeC'   => $completeC,
            'incompleteC' => max(0, $totalC - $completeC),
            'avgPct'      => $totalC > 0 ? (int) round($sumPct / $totalC) : 0,
            'rows'        => $rows,
        ];
    }

    /**
     * @return \Illuminate\Support\Collection<int, InvoiceRequest>
     */
    private function scopedRequests(User $user, ?string $month, ?string $dept)
    {
        $query = $this->baseRequestQuery($user);

        if ($month !== null) {
            $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $end   = (clone $start)->endOfMonth();
            $query->whereBetween('created_at', [$start, $end]);
        }

        if ($dept !== null && $user->canSeeAllDepartments()) {
            $query->where('department', $dept);
        }

        return $query->get();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<InvoiceRequest>
     */
    private function baseRequestQuery(User $user)
    {
        $q = InvoiceRequest::query();

        if ($user->canSeeAllDepartments()) {
            return $q;
        }

        if ($user->role === 'manager') {
            return $q->where('department', $user->department);
        }

        // employee
        return $q->where('created_by_id', $user->id);
    }
}
