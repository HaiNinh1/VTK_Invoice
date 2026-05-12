<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceRequestLegalDocument extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'invoice_request_id', 'document_type', 'file_path', 'original_filename', 'file_size', 'mime_type', 'uploaded_by_id', 'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function invoiceRequest(): BelongsTo
    {
        return $this->belongsTo(InvoiceRequest::class);
    }
}
