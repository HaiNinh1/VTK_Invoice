<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case PendingVpgd = 'pending_vpgd';
    case Approved = 'approved';
    case Issued = 'issued';
    case Rejected = 'rejected';
    case Returned = 'returned';
    case Accounted = 'accounted';

    /**
     * Allowed forward transitions.
     *
     * @return array<int,self>
     */
    public function next(): array
    {
        return match ($this) {
            self::Draft => [self::Pending, self::PendingVpgd],
            self::Pending => [self::Approved, self::Rejected, self::Returned],
            self::PendingVpgd => [self::Approved, self::Rejected, self::Returned],
            self::Approved => [self::Issued],
            self::Issued => [self::Accounted],
            self::Rejected => [],
            self::Returned => [self::Pending, self::PendingVpgd],
            self::Accounted => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->next(), true);
    }
}
