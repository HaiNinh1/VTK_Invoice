<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commitment extends Model
{
    protected $fillable = [
        'invoice_request_id', 'code', 'content', 'status', 'deadline', 'created_by',
    ];

    protected $casts = [
        'deadline' => 'date',
    ];

    public function invoiceRequest(): BelongsTo
    {
        return $this->belongsTo(InvoiceRequest::class);
    }
}
