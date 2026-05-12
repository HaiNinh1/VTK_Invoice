<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\User;

/**
 * Phase 1 contract policy.
 *
 * Phase 1 hardens authorization so the existing CRUD endpoints (already
 * registered in `routes/api.php`) cannot be misused. Row-scoping by creator
 * or revenue center is deliberately deferred to Phase 3 because Contracts
 * does not yet carry those scoping columns. See plan §1.5 and Phase 3.
 */
class ContractPolicy
{
    public function viewAny(User $user): bool
    {
        // Authenticated users may list. Tighter scoping arrives in Phase 3.
        return $user !== null;
    }

    public function view(User $user, Contract $contract): bool
    {
        return $user !== null;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->can('contract.manage');
    }

    public function update(User $user, Contract $contract): bool
    {
        return $user->hasRole('admin') || $user->can('contract.manage');
    }

    public function delete(User $user, Contract $contract): bool
    {
        return $user->hasRole('admin') || $user->can('contract.manage');
    }
}
