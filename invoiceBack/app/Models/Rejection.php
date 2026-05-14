<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rejection extends Model
{
    use HasFactory;

    protected $fillable = ['request_id', 'kind', 'reason', 'by_id', 'at'];

    protected function casts(): array
    {
        return ['at' => 'datetime'];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'by_id');
    }
}
