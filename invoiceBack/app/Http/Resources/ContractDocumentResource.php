<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'kind' => $this->document_type,
            'document_type' => $this->document_type,
            'original_filename' => $this->original_filename,
            'file_path' => $this->file_path,
            'file_size' => $this->file_size,
            'mime_type' => $this->mime_type,
            'uploaded_by_id' => $this->uploaded_by_id,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
