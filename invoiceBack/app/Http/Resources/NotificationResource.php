<?php

namespace App\Http\Resources;

use App\Models\NotificationSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /** Same category map as FE NotificationsContext.KIND_TO_CATEGORY. */
    private const KIND_TO_CATEGORY = [
        'pendingApproval' => 'approval',
        'approved' => 'approval',
        'rejected' => 'approval',
        'returned' => 'approval',
        'legalDueSoon' => 'legal',
        'commitmentOverdue' => 'legal',
        'exportSuccess' => 'system',
        'exportError' => 'system',
        'system' => 'system',
    ];

    public function toArray(Request $request): array
    {
        $data = is_array($this->data_json) ? $this->data_json : [];

        return [
            'id' => $this->id,
            'kind' => $this->kind,
            'category' => self::KIND_TO_CATEGORY[$this->kind] ?? 'system',
            'title' => $this->title,
            'description' => $this->description,
            'date' => optional($this->created_at)->toIso8601String(),
            'read' => $this->read_at !== null,
            'to' => $data['to'] ?? null,
            'requestId' => $data['requestId'] ?? null,
            'contractId' => $data['contractId'] ?? null,
        ];
    }
}
