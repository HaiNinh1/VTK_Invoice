<?php

namespace App\Observers;

use App\Models\Request as InvoiceRequest;
use App\Services\NotificationDispatcher;

/**
 * Reacts to Request status changes by dispatching the matching notification kind.
 * Wired in AppServiceProvider::boot().
 */
class RequestObserver
{
    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function updated(InvoiceRequest $req): void
    {
        if (! $req->wasChanged('status')) {
            return;
        }
        $this->dispatcher->onRequestStatusChanged($req, $req->getOriginal('status'));
    }

    public function created(InvoiceRequest $req): void
    {
        // Drafts created in 'Chờ duyệt' status (rare) should still notify.
        if ($req->status === 'Chờ duyệt') {
            $this->dispatcher->onRequestStatusChanged($req, null);
        }
    }
}
