<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceRequestDocument extends Model
{
    protected $fillable = [
        'invoice_request_id', 'legal_document_id', 'name',
        'file_path', 'file_size', 'mime_type', 'uploaded_by', 'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public function invoiceRequest(): BelongsTo
    {
        return $this->belongsTo(InvoiceRequest::class);
    }

    public function legalDocument(): BelongsTo
    {
        return $this->belongsTo(LegalDocument::class);
    }
}
