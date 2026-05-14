<?php

namespace App\Policies;

use App\Models\InvoiceType;
use App\Models\User;

/**
 * Per FE: /cai-dat 'Loại HĐ' tab is admin-only in the UI.
 * Reads are public to authenticated users (used by HopDongDetail checklist).
 */
class InvoiceTypePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, InvoiceType $type): bool
    {
        return true;
    }

    public function manage(User $user): bool
    {
        return $user->isAdmin();
    }
}
