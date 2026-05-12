<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case PendingVpgd = 'pending-vpgd';
    case Approved = 'approved';
    case Issued = 'issued';
    case Rejected = 'rejected';
    case Accounted = 'accounted';

    /**
     * Allowed forward transitions.
     *
     * @return array<int,self>
     */
    public function next(): array
    {
        return match ($this) {
            self::Draft => [self::Pending],
            self::Pending => [self::PendingVpgd, self::Rejected],
            self::PendingVpgd => [self::Approved, self::Rejected],
            self::Approved => [self::Issued],
            self::Issued => [self::Accounted],
            self::Rejected => [self::Draft, self::Pending],
            self::Accounted => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->next(), true);
    }
}
