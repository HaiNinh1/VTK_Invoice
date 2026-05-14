<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSetting extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'key', 'enabled'];

    protected function casts(): array
    {
        return ['enabled' => 'boolean'];
    }

    /** All 9 notification keys (must match FE NotificationsContext exactly). */
    public const KINDS = [
        'pendingApproval', 'approved', 'rejected', 'returned',
        'exportSuccess', 'exportError', 'legalDueSoon', 'commitmentOverdue', 'system',
    ];

    /** Default enabled state (system defaults to false to match FE). */
    public const DEFAULTS = [
        'pendingApproval' => true,
        'approved' => true,
        'rejected' => true,
        'returned' => true,
        'exportSuccess' => true,
        'exportError' => true,
        'legalDueSoon' => true,
        'commitmentOverdue' => true,
        'system' => false,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
