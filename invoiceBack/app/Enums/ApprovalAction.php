<?php

namespace App\Enums;

enum ApprovalAction: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Returned = 'returned';
}
