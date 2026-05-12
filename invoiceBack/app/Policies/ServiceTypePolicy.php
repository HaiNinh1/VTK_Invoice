<?php

namespace App\Policies;

use App\Models\ServiceType;
use App\Models\User;

class ServiceTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->canManage($user);
    }

    public function view(User $user, ServiceType $serviceType): bool
    {
        return $this->canManage($user);
    }

    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    public function update(User $user, ServiceType $serviceType): bool
    {
        return $this->canManage($user);
    }

    public function delete(User $user, ServiceType $serviceType): bool
    {
        return $this->canManage($user);
    }

    private function canManage(User $user): bool
    {
        return $user->hasRole('admin') || $user->can('catalog.manage');
    }
}
