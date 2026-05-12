<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Commitment extends Model
{
    use LogsActivity;

    protected $fillable = [
        'invoice_request_id', 'code', 'content', 'missing_documents', 'signature_snapshot_id',
        'director_id', 'director_decision', 'director_note', 'extensions', 'status', 'deadline', 'created_by',
    ];

    protected $casts = [
        'deadline' => 'date',
        'missing_documents' => 'array',
        'extensions' => 'array',
    ];

    public function invoiceRequest(): BelongsTo
    {
        return $this->belongsTo(InvoiceRequest::class);
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
