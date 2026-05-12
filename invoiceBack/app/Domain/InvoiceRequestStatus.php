<?php

namespace App\Domain;

final class InvoiceRequestStatus
{
    public const Draft = 'draft';

    public const Pending = 'pending';

    public const PendingVpgd = 'pending_vpgd';

    public const Approved = 'approved';

    public const Issued = 'issued';

    public const Accounted = 'accounted';

    public const Rejected = 'rejected';

    public const Returned = 'returned';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::Draft,
            self::Pending,
            self::PendingVpgd,
            self::Approved,
            self::Issued,
            self::Accounted,
            self::Rejected,
            self::Returned,
        ];
    }
}
