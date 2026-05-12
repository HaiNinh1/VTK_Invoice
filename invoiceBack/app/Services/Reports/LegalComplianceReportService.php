<?php

namespace App\Services\Reports;

use App\Models\InvoiceRequest;
use Illuminate\Database\Eloquent\Builder;

class LegalComplianceReportService
{
    public function generate(array $filters): array
    {
        $base = $this->baseQuery($filters);
        $total = (clone $base)->count();
        $complete = (clone $base)->where('legal_status_cache->status', 'complete')->count();
        $supplementing = (clone $base)->where('legal_status_cache->status', 'supplementing')->count();
        $insufficient = (clone $base)->where('legal_status_cache->status', 'missing')->count();
        $overdue = (clone $base)
            ->whereHas('commitments', fn (Builder $query) => $query
                ->whereIn('status', ['pending', 'extended'])
                ->whereDate('deadline', '<', now()->toDateString()))
            ->count();

        return [
            'data' => [
                'totals' => [
                    'total' => $total,
                    'complete' => $complete,
                    'supplementing' => $supplementing,
                    'insufficient' => $insufficient,
                    'overdue' => $overdue,
                    'completion_rate' => $total === 0 ? 0.0 : round(($complete / $total) * 100, 2),
                ],
                'by_center' => $this->groupedByCenter($filters),
                'by_service' => $this->groupedByService($filters),
            ],
        ];
    }

    protected function baseQuery(array $filters): Builder
    {
        return InvoiceRequest::query()
            ->when(! empty($filters['from']), fn (Builder $query) => $query->whereDate('created_at', '>=', $filters['from']))
            ->when(! empty($filters['to']), fn (Builder $query) => $query->whereDate('created_at', '<=', $filters['to']))
            ->when(! empty($filters['revenue_center_id']), fn (Builder $query) => $query->where('revenue_center_id', $filters['revenue_center_id']))
            ->when(! empty($filters['service_type_id']), fn (Builder $query) => $query->where('service_type_id', $filters['service_type_id']));
    }

    protected function groupedByCenter(array $filters): array
    {
        return $this->baseQuery($filters)
            ->leftJoin('revenue_centers', 'invoice_requests.revenue_center_id', '=', 'revenue_centers.id')
            ->selectRaw('invoice_requests.revenue_center_id, revenue_centers.name, COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(invoice_requests.legal_status_cache, '$.status')) = 'complete' THEN 1 ELSE 0 END) as complete")
            ->groupBy('invoice_requests.revenue_center_id', 'revenue_centers.name')
            ->orderBy('revenue_centers.name')
            ->get()
            ->map(fn ($row) => [
                'revenue_center_id' => $row->revenue_center_id,
                'name' => $row->name,
                'total' => (int) $row->total,
                'complete' => (int) $row->complete,
            ])
            ->all();
    }

    protected function groupedByService(array $filters): array
    {
        return $this->baseQuery($filters)
            ->leftJoin('service_types', 'invoice_requests.service_type_id', '=', 'service_types.id')
            ->selectRaw('invoice_requests.service_type_id, service_types.name, COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(invoice_requests.legal_status_cache, '$.status')) = 'complete' THEN 1 ELSE 0 END) as complete")
            ->groupBy('invoice_requests.service_type_id', 'service_types.name')
            ->orderBy('service_types.name')
            ->get()
            ->map(fn ($row) => [
                'service_type_id' => $row->service_type_id,
                'name' => $row->name,
                'total' => (int) $row->total,
                'complete' => (int) $row->complete,
            ])
            ->all();
    }
}
