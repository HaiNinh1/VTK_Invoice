<?php

namespace App\Services;

use App\Models\InvoiceRequest;
use App\Models\LegalDocument;

class LegalComplianceService
{
    /**
     * Compute legal compliance for an invoice request.
     *
     * Required document codes now come from the invoice type/legal document
     * pivot when it has required rows. During the migration path, invoice types
     * without pivot rows still fall back to the legacy `required_legal_documents`
     * JSON array, then finally to catalog defaults (`default_required = true`).
     *
     * Completed codes come from distinct `document_type` values in the
     * `invoice_request_legal_documents` table for this invoice request.
     *
     * @return array{required:array<int,string>,completed:array<int,string>,missing:array<int,string>,status:string}
     */
    public function compute(InvoiceRequest $request): array
    {
        $required = $this->requiredCodesFor($request);
        $uploaded = $this->uploadedCodesFor($request);

        // Required codes that have been satisfied.
        $completed = array_values(array_intersect($required, $uploaded));
        $missing = array_values(array_diff($required, $uploaded));

        $status = match (true) {
            count($required) === 0 => 'complete',
            count($missing) === 0 => 'complete',
            count($completed) === 0 => 'missing',
            default => 'supplementing',
        };

        return [
            'required' => $required,
            'completed' => $completed,
            'missing' => $missing,
            'status' => $status,
        ];
    }

    /**
     * Persist compliance into the invoice request: both the JSON cache and the
     * derived `legal_complete` boolean. The boolean is the single source of
     * truth for the approval workflow and is recomputed server-side only.
     */
    public function refresh(InvoiceRequest $request): InvoiceRequest
    {
        $compliance = $this->compute($request);

        $request->legal_status_cache = $compliance;
        $request->legal_complete = $compliance['status'] === 'complete';
        $request->save();

        return $request;
    }

    /**
     * @return array<int,string>
     */
    public function missingDocuments(InvoiceRequest $request): array
    {
        return $this->compute($request)['missing'];
    }

    /**
     * Resolve the required legal document codes for an invoice request. The
     * normalized invoice_type_legal_document pivot is authoritative when
     * populated; otherwise legacy JSON/default catalog fallbacks keep existing
     * seeded data and historical invoices compatible.
     *
     * @return array<int,string>
     */
    protected function requiredCodesFor(InvoiceRequest $request): array
    {
        $type = $request->relationLoaded('invoiceType')
            ? $request->invoiceType
            : $request->invoiceType()->first();

        if ($type !== null && $type->legalDocuments()->exists()) {
            return $type->legalDocuments()
                ->wherePivot('required', true)
                ->pluck('legal_documents.code')
                ->map(fn ($code) => (string) $code)
                ->unique()
                ->values()
                ->all();
        }

        $codes = $type?->required_legal_documents;

        if (is_array($codes) && count($codes) > 0) {
            return array_values(array_unique(array_map('strval', $codes)));
        }

        return LegalDocument::query()
            ->where('default_required', true)
            ->pluck('code')
            ->map(fn ($c) => (string) $c)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Distinct document_type codes uploaded for the invoice request.
     *
     * @return array<int,string>
     */
    protected function uploadedCodesFor(InvoiceRequest $request): array
    {
        return $request->legalDocuments()
            ->select('document_type')
            ->distinct()
            ->pluck('document_type')
            ->filter()
            ->map(fn ($c) => (string) $c)
            ->unique()
            ->values()
            ->all();
    }
}
