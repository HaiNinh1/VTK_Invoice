<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\User;

class ContractPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // all authenticated users; scoping applied in controller
    }

    public function view(User $user, Contract $contract): bool
    {
        if ($user->canSeeAllDepartments()) {
            return true;
        }
        return $contract->department === $user->department;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Contract $contract): bool
    {
        return $this->view($user, $contract);
    }

    public function delete(User $user, Contract $contract): bool
    {
        return $this->view($user, $contract);
    }
}
