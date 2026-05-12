<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Commitment extends Model
{
    use LogsActivity, SoftDeletes;

    protected $fillable = [
        'invoice_request_id', 'code', 'content', 'missing_documents', 'signature_snapshot_id',
        'director_id', 'director_decision', 'director_note', 'extensions', 'status', 'deadline', 'created_by',
        'signer_id', 'signed_at',
    ];

    protected $casts = [
        'deadline' => 'date',
        'signed_at' => 'datetime',
        'missing_documents' => 'array',
        'extensions' => 'array',
    ];

    public function invoiceRequest(): BelongsTo
    {
        return $this->belongsTo(InvoiceRequest::class);
    }

    public function signer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signer_id');
    }

    public function signatureSnapshot(): BelongsTo
    {
        return $this->belongsTo(SignatureSnapshot::class);
    }

    public function director(): BelongsTo
    {
        return $this->belongsTo(User::class, 'director_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('commitment')
            ->logOnly(['status', 'content', 'director_decision', 'director_note', 'deadline'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
