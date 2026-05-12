<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentInstallmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'sequence' => $this->sequence,
            'name' => $this->name,
            'amount' => (string) $this->amount,
            'due_date' => optional($this->due_date)->toDateString(),
            'status' => $this->status,
            'invoiced_amount' => (string) $this->invoiced_amount,
            'paid_amount' => (string) $this->paid_amount,
            'notes' => $this->notes,
        ];
    }
}
