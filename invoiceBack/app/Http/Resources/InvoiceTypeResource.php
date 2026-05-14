<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'serviceType' => $this->service_type,
            'active' => (bool) $this->active,
            'documentGroups' => DocumentGroupResource::collection($this->whenLoaded('documentGroups'))->resolve(),
        ];
    }
}
