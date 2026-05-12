<?php

namespace App\Enums;

enum VfsStatus: string
{
    case None = 'none';
    case Pending = 'pending';
    case Processing = 'processing';
    case Posted = 'posted';
}
