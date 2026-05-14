<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
        'role', 'department', 'phone', 'title',
        'has_signature', 'signature_path',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'has_signature' => 'boolean',
        ];
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'created_by_id');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(Request::class, 'created_by_id');
    }

    public function notificationSettings(): HasMany
    {
        return $this->hasMany(NotificationSetting::class);
    }

    /** Public-facing code used by FE (e.g. 'u1'). */
    public function getCodeAttribute(): string
    {
        return 'u' . $this->id;
    }

    public function isAccountant(): bool
    {
        return $this->role === 'accountant';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function canSeeAllDepartments(): bool
    {
        return in_array($this->role, ['accountant', 'admin'], true);
    }
}
