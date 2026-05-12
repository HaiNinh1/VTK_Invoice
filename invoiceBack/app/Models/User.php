<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'employee_code',
        'department_id',
        'revenue_center_id',
        'avatar_path',
        'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function revenueCenter(): BelongsTo
    {
        return $this->belongsTo(RevenueCenter::class);
    }

    public function invoiceRequests(): HasMany
    {
        return $this->hasMany(InvoiceRequest::class, 'creator_id');
    }

    /** Role helper aliases (string name). */
    public function hasAnyRoleName(string|array $roles): bool
    {
        return $this->hasAnyRole($roles);
    }
}
