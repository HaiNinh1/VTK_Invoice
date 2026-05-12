<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LegalDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'group' => $this->group,
            'default_required' => (bool) $this->default_required,
            'default_deadline_days' => $this->default_deadline_days,
            'enabled' => (bool) $this->enabled,
            'required' => $this->whenPivotLoaded('invoice_type_legal_document', fn () => (bool) $this->pivot->required),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
