<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractDocument extends Model
{
    protected $fillable = [
        'contract_id', 'document_type', 'file_path', 'original_filename', 'file_size', 'mime_type', 'uploaded_by_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
