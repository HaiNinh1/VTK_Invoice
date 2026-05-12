<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code', 'customer_id', 'project_manager_id', 'revenue_center_id', 'name', 'total_amount',
        'total_value_after_tax', 'total_invoiced', 'total_paid', 'signed_date', 'expiry_date', 'status', 'notes',
    ];

    protected $appends = ['remaining_amount', 'progress'];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'total_value_after_tax' => 'decimal:2',
        'total_invoiced' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'signed_date' => 'date',
        'expiry_date' => 'date',
    ];

    public function getRemainingAmountAttribute(): float
    {
        return round((float) ($this->total_value_after_tax ?? 0) - (float) ($this->total_invoiced ?? 0), 2);
    }

    public function getProgressAttribute(): float
    {
        $total = (float) ($this->total_value_after_tax ?? 0);

        if ($total <= 0) {
            return 0.0;
        }

        return min(100.0, round(((float) ($this->total_invoiced ?? 0) / $total) * 100, 2));
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function projectManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function revenueCenter(): BelongsTo
    {
        return $this->belongsTo(RevenueCenter::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(PaymentInstallment::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ContractDocument::class);
    }

    public function invoiceRequests(): HasMany
    {
        return $this->hasMany(InvoiceRequest::class);
    }
}
