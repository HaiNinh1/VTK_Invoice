<?php

namespace App\Notifications;

use App\Models\InvoiceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoicePendingApprovalNotification extends Notification
{
    use Queueable;

    public function __construct(public InvoiceRequest $invoiceRequest, public string $event = 'pending') {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'category' => 'approval',
            'event' => $this->event,
            'invoice_request_id' => $this->invoiceRequest->id,
            'request_code' => $this->invoiceRequest->request_code,
            'status' => $this->invoiceRequest->status?->value,
            'revenue_center_id' => $this->invoiceRequest->revenue_center_id,
            'creator_id' => $this->invoiceRequest->creator_id,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Invoice {$this->invoiceRequest->request_code} {$this->event}")
            ->line("Invoice {$this->invoiceRequest->request_code} is {$this->event}.");
    }
}
