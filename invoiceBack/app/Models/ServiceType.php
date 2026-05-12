<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class ServiceType extends Model
{
    use LogsActivity;

    protected $fillable = ['code', 'name'];

    public function invoiceTypes(): BelongsToMany
    {
        return $this->belongsToMany(InvoiceType::class, 'invoice_type_service_type')->withTimestamps();
    }

    public function invoiceRequests(): HasMany
    {
        return $this->hasMany(InvoiceRequest::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('service_type')
            ->logOnly(['code', 'name'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
