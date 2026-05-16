<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Key/value setting store. Values are encrypted at rest via the `encrypted:array` cast.
 * Use static helpers `get($key, $default)` and `set($key, $value)` instead of direct queries.
 */
class AppSetting extends Model
{
    protected $table = 'app_settings';
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // only `updated_at` column, managed manually on save

    protected $fillable = ['key', 'value'];
    protected $casts = [
        'value' => 'encrypted:array',
    ];

    public static function getValue(string $key, array $default = []): array
    {
        $row = static::query()->find($key);

        return $row?->value ?? $default;
    }

    public static function setValue(string $key, array $value): void
    {
        $row = static::query()->find($key) ?? new static(['key' => $key]);
        $row->value = $value;
        $row->updated_at = now();
        $row->save();
    }
}
