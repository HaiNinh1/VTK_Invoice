<?php

namespace App\Enums;

enum SInvoiceStatus: string
{
    case None = 'none';
    case Pending = 'pending';
    case Processing = 'processing';
    case SentToCqt = 'sent-to-cqt';
    case Completed = 'completed';
    case Error = 'error';
}
