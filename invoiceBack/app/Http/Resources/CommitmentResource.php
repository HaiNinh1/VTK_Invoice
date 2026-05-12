<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommitmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $extensions = $this->extensions ?? [];
        $lastExtension = empty($extensions) ? null : $extensions[array_key_last($extensions)];

        return [
            'id' => $this->id,
            'code' => $this->code,
            'content' => $this->content,
            'deadline' => optional($this->deadline)->toDateString(),
            'status' => $this->status,
            'signer_id' => $this->signer_id,
            'signed_at' => optional($this->signed_at)->toIso8601String(),
            'missing_documents' => $this->missing_documents,
            'director_id' => $this->director_id,
            'director_decision' => $this->director_decision,
            'director_note' => $this->director_note,
            'extensions' => [
                'count' => count($extensions),
                'last' => $lastExtension,
            ],
            'days_remaining' => $this->deadline ? now()->startOfDay()->diffInDays($this->deadline->copy()->startOfDay(), false) : null,
            'signature_snapshot_id' => $this->signature_snapshot_id,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'invoice_request' => $this->whenLoaded('invoiceRequest', fn () => [
                'id' => $this->invoiceRequest->id,
                'request_code' => $this->invoiceRequest->request_code,
                'status' => str_replace('_', '-', $this->invoiceRequest->status?->value ?? (string) $this->invoiceRequest->status),
                'legal_complete' => (bool) $this->invoiceRequest->legal_complete,
            ]),
        ];
    }
}
