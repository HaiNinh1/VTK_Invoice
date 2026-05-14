<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractDocumentResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'group' => $this->group_name,       // FE uses 'group'
            'fileName' => $this->file_name,
            'filePath' => $this->file_path,
            'mime' => $this->mime,
            'size' => $this->size,
            'uploadDate' => optional($this->upload_date)->toDateString(),
        ];
    }
}
