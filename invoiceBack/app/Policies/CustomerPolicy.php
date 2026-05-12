<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

/**
 * Phase 1 customer policy.
 *
 * Same rationale as ContractPolicy: writes locked down to admins (and any
 * future holders of the `customer.manage` permission), reads remain open
 * to all authenticated users. Row-scoping by creator/center is a Phase 3
 * concern because Customer does not yet carry those columns. See plan §1.5.
 */
class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user !== null;
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user !== null;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->can('customer.manage');
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->hasRole('admin') || $user->can('customer.manage');
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $user->hasRole('admin') || $user->can('customer.manage');
    }
}
