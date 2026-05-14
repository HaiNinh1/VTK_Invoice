<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['document_group_id', 'code', 'name', 'required', 'sort_order'];

    protected function casts(): array
    {
        return ['required' => 'boolean'];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(DocumentGroup::class, 'document_group_id');
    }
}
