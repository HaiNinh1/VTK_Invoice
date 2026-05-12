<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalInvoices = (int) ($this->invoice_requests_count ?? $this->invoiceRequests()->count());
        $completeInvoices = (int) ($this->complete_invoice_requests_count ?? $this->invoiceRequests()->where('legal_complete', true)->count());

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'service_types' => ServiceTypeResource::collection($this->whenLoaded('serviceTypes')),
            'legal_documents' => LegalDocumentResource::collection($this->whenLoaded('legalDocuments')),
            'status' => $this->status,
            'total_invoices' => $totalInvoices,
            'compliance_rate' => $totalInvoices === 0 ? 0.0 : round(($completeInvoices / $totalInvoices) * 100, 2),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
