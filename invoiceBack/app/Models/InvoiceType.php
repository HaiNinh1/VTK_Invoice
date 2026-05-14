<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoiceType extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['id', 'name', 'service_type', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function documentGroups(): HasMany
    {
        return $this->hasMany(DocumentGroup::class)->orderBy('sort_order');
    }
}
