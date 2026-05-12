<?php

namespace App\Exceptions;

use RuntimeException;

class InstallmentAlreadyInvoicedException extends RuntimeException
{
    public function __construct(public readonly int $existingInvoiceRequestId)
    {
        parent::__construct('Installment already has an active invoice request.');
    }
}
