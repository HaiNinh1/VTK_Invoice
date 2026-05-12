<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'tax_code' => $this->customer->tax_code,
            ]),
            'name' => $this->name,
            'total_amount' => (string) $this->total_amount,
            'total_value_after_tax' => $this->total_value_after_tax === null ? null : (string) $this->total_value_after_tax,
            'total_invoiced' => (string) $this->total_invoiced,
            'total_paid' => (string) $this->total_paid,
            'remaining_amount' => $this->remaining_amount,
            'progress' => $this->progress,
            'project_manager' => $this->whenLoaded('projectManager', fn () => $this->projectManager ? [
                'id' => $this->projectManager->id,
                'name' => $this->projectManager->name,
                'email' => $this->projectManager->email,
            ] : null),
            'revenue_center' => $this->whenLoaded('revenueCenter', fn () => $this->revenueCenter ? [
                'id' => $this->revenueCenter->id,
                'code' => $this->revenueCenter->code,
                'name' => $this->revenueCenter->name,
            ] : null),
            'signed_date' => optional($this->signed_date)->toDateString(),
            'expiry_date' => optional($this->expiry_date)->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'installments_count' => $this->whenCounted('installments'),
            'documents_count' => $this->whenCounted('documents'),
            'installments' => PaymentInstallmentResource::collection($this->whenLoaded('installments')),
            'documents' => ContractDocumentResource::collection($this->whenLoaded('documents')),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
