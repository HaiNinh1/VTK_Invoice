<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Http\Controllers\Controller;
use App\Models\AuditApproval;
use App\Models\SignatureSnapshot;
use App\Models\User;
use App\Services\Reports\LegalComplianceReportService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LegalComplianceReportController extends Controller
{
    public function __construct(protected LegalComplianceReportService $reports) {}

    public function show(Request $request): array
    {
        $filters = $this->validatedFilters($request);

        return $this->reports->generate($filters);
    }

    public function approve(Request $request): array
    {
        $user = $request->user();
        abort_unless($user?->hasAnyRoleName(['admin', 'director']), 403);

        $filters = $this->validatedFilters($request);

        return DB::transaction(function () use ($user, $filters) {
            $payload = $this->reports->generate($filters);
            $signatureSnapshot = $this->snapshotSignature($user);

            $approval = AuditApproval::create([
                'report_type' => 'legal_compliance',
                'payload' => $payload,
                'approver_id' => $user->id,
                'signature_snapshot_id' => $signatureSnapshot->id,
                'approved_at' => now(),
            ]);

            return [
                'data' => [
                    'id' => $approval->id,
                    'report_type' => $approval->report_type,
                    'signature_snapshot_id' => $approval->signature_snapshot_id,
                    'approved_at' => optional($approval->approved_at)->toIso8601String(),
                    'payload' => $approval->payload,
                ],
            ];
        });
    }

    protected function validatedFilters(Request $request): array
    {
        return $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'revenue_center_id' => ['nullable', 'integer', 'exists:revenue_centers,id'],
            'service_type_id' => ['nullable', 'integer', 'exists:service_types,id'],
        ]);
    }

    protected function snapshotSignature(User $actor): SignatureSnapshot
    {
        $signature = $actor->signature;

        if (! $signature) {
            throw new AuthorizationException('signature_required');
        }

        return SignatureSnapshot::create([
            'user_id' => $actor->id,
            'signature_method' => $signature->method,
            'data_path' => $signature->data_path,
            'created_at' => now(),
        ]);
    }
}
