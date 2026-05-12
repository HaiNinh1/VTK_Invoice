<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Normalized notification shape consumed by the frontend.
 *
 * Required fields: id, category, type, title, message, data, read_at, priority, created_at.
 * `category` resolves from the notification payload first, then a class-name
 * heuristic, then a default of `system`.
 */
class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = $this->resolveData();
        $type = (string) ($this->type ?? '');

        return [
            'id' => $this->id,
            'type' => $type,
            'category' => $data['category'] ?? $this->resolveCategory($type),
            'title' => $data['title'] ?? $this->resolveTitle($data, $type),
            'message' => $data['message'] ?? $this->resolveMessage($data),
            'data' => $data,
            'read_at' => optional($this->read_at)->toIso8601String(),
            'priority' => $data['priority'] ?? 'normal',
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    protected function resolveData(): array
    {
        $raw = $this->data;
        if (is_array($raw)) {
            return $raw;
        }
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return [];
    }

    protected function resolveCategory(string $type): string
    {
        if ($type === '') {
            return 'system';
        }

        return match (true) {
            str_contains($type, 'Approval'),
            str_contains($type, 'Invoice') => 'approval',
            str_contains($type, 'Legal'),
            str_contains($type, 'Commitment') => 'legal',
            default => 'system',
        };
    }

    protected function resolveTitle(array $data, string $type): string
    {
        if (!empty($data['request_code'])) {
            $event = $data['event'] ?? 'updated';

            return "Hồ sơ {$data['request_code']} - {$event}";
        }

        return $type !== '' ? class_basename($type) : 'Notification';
    }

    protected function resolveMessage(array $data): string
    {
        if (!empty($data['event']) && !empty($data['request_code'])) {
            return "Sự kiện {$data['event']} cho hồ sơ {$data['request_code']}";
        }

        return '';
    }
}
