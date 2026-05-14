<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id', 'name', 'file_path', 'file_name',
        'checked', 'inherited_from_contract_doc_id', 'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'checked' => 'boolean',
            'uploaded_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }

    public function inheritedFrom(): BelongsTo
    {
        return $this->belongsTo(ContractDocument::class, 'inherited_from_contract_doc_id');
    }

    public function isInherited(): bool
    {
        return $this->inherited_from_contract_doc_id !== null;
    }
}
