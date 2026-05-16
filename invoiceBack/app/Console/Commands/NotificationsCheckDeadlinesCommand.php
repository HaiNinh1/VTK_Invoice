<?php

namespace App\Console\Commands;

use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;

/**
 * Scans for commitment deadlines: emits legalDueSoon (≤3 days) and
 * commitmentOverdue (deadline in past). Idempotent per day per request.
 *
 * Schedule: daily at 08:00 (configured in routes/console.php).
 */
class NotificationsCheckDeadlinesCommand extends Command
{
    protected $signature = 'notifications:check-deadlines';
    protected $description = 'Emit legalDueSoon / commitmentOverdue notifications based on request commitment deadlines';

    public function handle(NotificationDispatcher $dispatcher): int
    {
        $created = $dispatcher->dispatchDeadlineNotifications();
        $this->info("Notifications created: {$created}");
        return self::SUCCESS;
    }
}
