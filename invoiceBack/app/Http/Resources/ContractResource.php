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
            'customer' => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'name' => $this->name,
            'total_amount' => (string) $this->total_amount,
            'signed_date' => optional($this->signed_date)->toDateString(),
            'expiry_date' => optional($this->expiry_date)->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'installments' => PaymentInstallmentResource::collection($this->whenLoaded('installments')),
        ];
    }
}
