<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentTemplateResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code ?: (string) $this->id, // FE expects doc-id like 'hd1'; fallback to numeric
            '_id' => $this->id,                          // numeric DB id, used by mutations
            'name' => $this->name,
            'required' => (bool) $this->required,
        ];
    }
}
