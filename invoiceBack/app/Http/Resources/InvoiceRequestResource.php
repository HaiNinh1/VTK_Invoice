<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'request_code' => $this->request_code,
            'invoice_no' => $this->invoice_no,
            'status' => str_replace('_', '-', $this->status?->value ?? (string) $this->status),
            'invoice_type_id' => $this->invoice_type_id,
            'contract_id' => $this->contract_id,
            'payment_installment_id' => $this->payment_installment_id,
            'installment_id' => $this->payment_installment_id,
            'contract_number' => $this->contract_number,
            'contract_date' => optional($this->contract_date)->toDateString(),
            'invoice_type' => $this->whenLoaded('invoiceType', fn () => [
                'id' => $this->invoiceType->id,
                'code' => $this->invoiceType->code,
                'name' => $this->invoiceType->name,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'tax_code' => $this->customer->tax_code,
            ]),
            'service_type' => $this->whenLoaded('serviceType', fn () => $this->serviceType->name),
            'revenue_center' => $this->whenLoaded('revenueCenter', fn () => $this->revenueCenter->code),
            'revenue_center_id' => $this->revenue_center_id,
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'creator_id' => $this->creator_id,
            'before_vat' => (string) $this->before_vat,
            'tax_rate' => (string) $this->tax_rate,
            'after_vat' => (string) $this->after_vat,
            'legal_status' => $this->legal_status_cache,
            'legal_complete' => (bool) $this->legal_complete,
            'commitment' => $this->whenLoaded('commitments', function () {
                $commitment = $this->commitments->sortByDesc('created_at')->first();

                return $commitment?->only(['id', 'code', 'status', 'deadline', 'director_decision']);
            }),
            'current_handler_id' => $this->current_handler_id,
            'approved_by_id' => $this->approved_by_id,
            'return_reason' => $this->return_reason,
            'rejection_reason' => $this->rejection_reason,
            's_invoice_status' => $this->s_invoice_status?->value,
            's_invoice_code' => $this->s_invoice_code,
            's_invoice_error' => $this->s_invoice_error,
            'vfs_status' => $this->vfs_status?->value,
            'notes' => $this->notes,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
