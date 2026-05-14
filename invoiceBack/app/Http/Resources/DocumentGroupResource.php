<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentGroupResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'groupName' => $this->name,     // FE uses groupName
            'documents' => DocumentTemplateResource::collection($this->whenLoaded('templates'))->resolve(),
        ];
    }
}
