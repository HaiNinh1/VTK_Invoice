<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractDocument extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'contract_id', 'document_type', 'file_path', 'original_filename', 'file_size', 'uploaded_by_id', 'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
