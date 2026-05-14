<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Request — Đề nghị xuất hoá đơn.
 * Note: this class shadows Illuminate\Http\Request when imported without alias.
 * Always reference as App\Models\Request to avoid conflicts.
 *
 * @property string $id DN-YYYY-NNNNN
 */
class Request extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_id', 'contract_number',
        'customer_name', 'customer_tax_code', 'customer_address',
        'service_type', 'department',
        'value_before_vat', 'vat_rate', 'vat_amount', 'value_after_vat',
        'payment_term', 'payment_method',
        'invoice_type', 'original_invoice_number', 'adjustment_reason',
        'buyer_email', 'notes',
        'status',
        'has_commitment', 'commitment_text', 'commitment_deadline',
        'legal_total', 'legal_checked',
        'reject_reason', 'return_reason',
        'created_by_id',
        'submitted_at', 'recalled_at',
    ];

    protected function casts(): array
    {
        return [
            'value_before_vat' => 'decimal:0',
            'vat_amount' => 'decimal:0',
            'value_after_vat' => 'decimal:0',
            'has_commitment' => 'boolean',
            'commitment_deadline' => 'date',
            'submitted_at' => 'datetime',
            'recalled_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(RequestDocument::class);
    }

    public function approval(): HasOne
    {
        return $this->hasOne(Approval::class);
    }

    public function rejections(): HasMany
    {
        return $this->hasMany(Rejection::class);
    }

    public function sInvoice(): HasOne
    {
        return $this->hasOne(SInvoice::class);
    }
}
