<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class UserSignature extends Model
{
    use LogsActivity;

    protected $fillable = [
        'user_id', 'method', 'data_path', 'font_family',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('user_signature')
            ->logOnly(['method', 'data_path', 'font_family'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
