<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Approval extends Model
{
    use HasFactory;

    protected $primaryKey = 'request_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'request_id', 'approved_by_id', 'approved_at',
        'accounting_ref_no', 'account_revenue', 'account_tax', 'account_receivable',
        'approval_note', 'signature_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'signature_snapshot' => 'array',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }
}
