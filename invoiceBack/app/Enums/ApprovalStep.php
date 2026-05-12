<?php

namespace App\Enums;

/**
 * Approval ladder. Step 1 = department manager, 2 = accountant, 3 = director.
 * Mapping aligns with the permission a user must hold to act on the step.
 */
enum ApprovalStep: int
{
    case Department = 1;
    case Accountant = 2;
    case Director = 3;

    public function permission(): string
    {
        return match ($this) {
            self::Department => 'invoice.approve.dept',
            self::Accountant => 'invoice.approve.accountant',
            self::Director => 'invoice.approve.director',
        };
    }

    /**
     * Status the request must be in for this step to act.
     */
    public function requiresStatus(): InvoiceStatus
    {
        return match ($this) {
            self::Department => InvoiceStatus::Pending,
            self::Accountant => InvoiceStatus::PendingVpgd,
            self::Director => InvoiceStatus::PendingVpgd,
        };
    }

    /**
     * Status the request transitions to after an approval at this step.
     */
    public function approvedStatus(): InvoiceStatus
    {
        return match ($this) {
            self::Department => InvoiceStatus::PendingVpgd,
            self::Accountant => InvoiceStatus::PendingVpgd, // still needs director
            self::Director => InvoiceStatus::Approved,
        };
    }
}
