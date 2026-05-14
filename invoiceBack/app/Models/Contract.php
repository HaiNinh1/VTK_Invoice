<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Contract — Hợp đồng kinh tế.
 *
 * @property string $id  HD-YYYY-NNN
 */
class Contract extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_number',
        'customer_name', 'customer_tax_code', 'customer_address',
        'customer_representative', 'customer_email', 'customer_phone',
        'service_type', 'sign_date', 'total_value', 'currency',
        'department', 'status', 'notes', 'created_by_id',
    ];

    protected function casts(): array
    {
        return [
            'sign_date' => 'date',
            'total_value' => 'decimal:0',
        ];
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ContractDocument::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(Request::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
