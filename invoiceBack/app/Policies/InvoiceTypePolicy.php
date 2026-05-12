<?php

namespace App\Policies;

use App\Models\InvoiceType;
use App\Models\User;

class InvoiceTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->canManage($user);
    }

    public function view(User $user, InvoiceType $invoiceType): bool
    {
        return $this->canManage($user);
    }

    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    public function update(User $user, InvoiceType $invoiceType): bool
    {
        return $this->canManage($user);
    }

    public function delete(User $user, InvoiceType $invoiceType): bool
    {
        return $this->canManage($user);
    }

    private function canManage(User $user): bool
    {
        return $user->hasRole('admin') || $user->can('catalog.manage') || $user->can('invoice_type.manage');
    }
}
