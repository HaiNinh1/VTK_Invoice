<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentInstallment extends Model
{
    protected $fillable = [
        'contract_id', 'sequence', 'name', 'amount', 'due_date', 'status', 'invoiced_amount', 'paid_amount', 'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'invoiced_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function invoiceRequests(): HasMany
    {
        return $this->hasMany(InvoiceRequest::class);
    }
}
