<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceType extends Model
{
    protected $fillable = ['code', 'name', 'description', 'required_legal_documents', 'status', 'created_by', 'updated_by'];

    protected $casts = [
        'required_legal_documents' => 'array',
    ];
}
