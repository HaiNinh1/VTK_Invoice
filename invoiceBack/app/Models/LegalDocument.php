<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class LegalDocument extends Model
{
    use LogsActivity;

    protected $fillable = ['code', 'name', 'description', 'group', 'default_required', 'default_deadline_days', 'enabled'];

    protected $casts = [
        'default_required' => 'boolean',
        'enabled' => 'boolean',
    ];

    public function invoiceTypes(): BelongsToMany
    {
        return $this->belongsToMany(InvoiceType::class, 'invoice_type_legal_document')
            ->withPivot('required')
            ->withTimestamps();
    }

    public function invoiceRequestDocuments(): HasMany
    {
        return $this->hasMany(InvoiceRequestDocument::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('legal_document')
            ->logOnly(['code', 'name', 'description', 'group', 'default_required', 'default_deadline_days', 'enabled'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
