<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name', 'tax_code', 'address',
        'contact_name', 'contact_phone', 'contact_email',
    ];
}
