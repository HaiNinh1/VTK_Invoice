<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class InvoiceType extends Model
{
    use LogsActivity, SoftDeletes;

    protected $fillable = ['code', 'name', 'description', 'required_legal_documents', 'status', 'created_by', 'updated_by'];

    protected $casts = [
        'required_legal_documents' => 'array',
    ];

    public function serviceTypes(): BelongsToMany
    {
        return $this->belongsToMany(ServiceType::class, 'invoice_type_service_type')->withTimestamps();
    }

    public function legalDocuments(): BelongsToMany
    {
        return $this->belongsToMany(LegalDocument::class, 'invoice_type_legal_document')
            ->withPivot('required')
            ->withTimestamps();
    }

    public function invoiceRequests(): HasMany
    {
        return $this->hasMany(InvoiceRequest::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('invoice_type')
            ->logOnly(['code', 'name', 'description', 'status'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
