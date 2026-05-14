<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentGroup extends Model
{
    use HasFactory;

    protected $fillable = ['invoice_type_id', 'name', 'sort_order'];

    public function invoiceType(): BelongsTo
    {
        return $this->belongsTo(InvoiceType::class);
    }

    public function templates(): HasMany
    {
        return $this->hasMany(DocumentTemplate::class)->orderBy('sort_order');
    }
}
