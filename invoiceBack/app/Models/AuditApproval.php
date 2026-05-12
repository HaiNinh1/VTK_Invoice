<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditApproval extends Model
{
    protected $fillable = [
        'report_type', 'payload', 'approver_id', 'signature_snapshot_id', 'approved_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'approved_at' => 'datetime',
    ];

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function signatureSnapshot(): BelongsTo
    {
        return $this->belongsTo(SignatureSnapshot::class);
    }
}
