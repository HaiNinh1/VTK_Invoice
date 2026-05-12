<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceRequestLegalDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_request_id' => $this->invoice_request_id,
            'document_type' => $this->document_type,
            'file_path' => $this->file_path,
            'original_filename' => $this->original_filename,
            'file_size' => $this->file_size,
            'mime_type' => $this->mime_type,
            'uploaded_by_id' => $this->uploaded_by_id,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
