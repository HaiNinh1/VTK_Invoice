<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_request_id' => $this->invoice_request_id,
            'step' => $this->step,
            'action' => $this->action?->value,
            'approver_id' => $this->approver_id,
            'approver' => $this->whenLoaded('approver', fn () => [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ]),
            'comment' => $this->comment,
            'acted_at' => optional($this->acted_at)->toIso8601String(),
        ];
    }
}
