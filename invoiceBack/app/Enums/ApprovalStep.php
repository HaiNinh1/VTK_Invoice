<?php

namespace App\Enums;

/**
 * Approval branches. Step 2 = accountant normal flow, 3 = director special flow.
 * Mapping aligns with the permission a user must hold to act on the step.
 */
enum ApprovalStep: int
{
    case Accountant = 2;
    case Director = 3;

    public function permission(): string
    {
        return match ($this) {
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
            self::Accountant => InvoiceStatus::Pending,
            self::Director => InvoiceStatus::PendingVpgd,
        };
    }

    /**
     * Status the request transitions to after an approval at this step.
     */
    public function approvedStatus(): InvoiceStatus
    {
        return match ($this) {
            self::Accountant => InvoiceStatus::Approved,
            self::Director => InvoiceStatus::Approved,
        };
    }
}
