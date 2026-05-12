<?php

namespace App\Services;

use App\Models\InvoiceRequest;
use App\Models\LegalDocument;

class LegalComplianceService
{
    /**
     * Compute simple compliance for an invoice request.
     * MVP rule: required = count of legal_documents flagged default_required=true,
     * completed = count of uploaded request documents linked to a legal document.
     *
     * @return array{completed:int,total:int,status:string}
     */
    public function compute(InvoiceRequest $request): array
    {
        $total = LegalDocument::where('default_required', true)->count();
        $completed = $request->documents()
            ->whereNotNull('legal_document_id')
            ->distinct('legal_document_id')
            ->count('legal_document_id');

        $status = match (true) {
            $total === 0 => 'complete',
            $completed >= $total => 'complete',
            $completed === 0 => 'missing',
            default => 'supplementing',
        };

        return [
            'completed' => $completed,
            'total' => $total,
            'status' => $status,
        ];
    }

    public function refresh(InvoiceRequest $request): InvoiceRequest
    {
        $request->legal_status_cache = $this->compute($request);
        $request->save();

        return $request;
    }
}
