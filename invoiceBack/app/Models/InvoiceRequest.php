<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use App\Enums\SInvoiceStatus;
use App\Enums\VfsStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'request_code', 'invoice_no', 'invoice_type_id', 'customer_id', 'service_type_id',
        'contract_id', 'payment_installment_id', 'revenue_center_id', 'creator_id', 'department_id',
        'before_vat', 'tax_rate', 'after_vat', 'status', 'legal_status_cache',
        's_invoice_status', 's_invoice_code', 's_invoice_error', 'vfs_status',
        'notes', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'status' => InvoiceStatus::class,
        's_invoice_status' => SInvoiceStatus::class,
        'vfs_status' => VfsStatus::class,
        'legal_status_cache' => 'array',
        'before_vat' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'after_vat' => 'decimal:2',
    ];

    public function invoiceType(): BelongsTo
    {
        return $this->belongsTo(InvoiceType::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function serviceType(): BelongsTo
    {
        return $this->belongsTo(ServiceType::class);
    }

    public function revenueCenter(): BelongsTo
    {
        return $this->belongsTo(RevenueCenter::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(InvoiceRequestDocument::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function commitments(): HasMany
    {
        return $this->hasMany(Commitment::class);
    }

    /**
     * Apply revenue center scope based on the given user's role.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasAnyRoleName(['admin', 'accountant', 'director'])) {
            return $query;
        }
        if ($user->hasRole('manager')) {
            return $query->where('revenue_center_id', $user->revenue_center_id);
        }

        // employee or unknown: own only
        return $query->where('creator_id', $user->id);
    }
}
