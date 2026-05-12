<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceType extends Model
{
    protected $fillable = ['code', 'name', 'description', 'status', 'created_by', 'updated_by'];
}
