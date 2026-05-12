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
            'status' => $this->status?->value,
            'invoice_type_id' => $this->invoice_type_id,
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
            's_invoice_status' => $this->s_invoice_status?->value,
            's_invoice_code' => $this->s_invoice_code,
            'vfs_status' => $this->vfs_status?->value,
            'notes' => $this->notes,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
