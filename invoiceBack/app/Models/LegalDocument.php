<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LegalDocument extends Model
{
    protected $fillable = ['code', 'name', 'description', 'default_required'];

    protected $casts = [
        'default_required' => 'boolean',
    ];
}
