<?php

namespace App\Models;

use App\Enums\ApprovalAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Approval extends Model
{
    protected $fillable = [
        'invoice_request_id', 'approver_id', 'step', 'action', 'comment', 'acted_at',
    ];

    protected $casts = [
        'action' => ApprovalAction::class,
        'acted_at' => 'datetime',
        'step' => 'integer',
    ];

    public function invoiceRequest(): BelongsTo
    {
        return $this->belongsTo(InvoiceRequest::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
