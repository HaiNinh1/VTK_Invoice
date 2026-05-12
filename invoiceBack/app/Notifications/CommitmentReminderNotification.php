<?php

namespace App\Notifications;

use App\Models\Commitment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CommitmentReminderNotification extends Notification
{
    use Queueable;

    public function __construct(public Commitment $commitment, public User $actor) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $invoiceRequest = $this->commitment->invoiceRequest;

        return [
            'category' => 'legal',
            'event' => 'commitment_reminder',
            'title' => "Nhắc cam kết {$this->commitment->code}",
            'message' => "Cam kết {$this->commitment->code} cần được bổ sung trước hạn.",
            'commitment_id' => $this->commitment->id,
            'commitment_code' => $this->commitment->code,
            'invoice_request_id' => $invoiceRequest?->id,
            'request_code' => $invoiceRequest?->request_code,
            'actor_id' => $this->actor->id,
            'deadline' => optional($this->commitment->deadline)->toDateString(),
        ];
    }
}
