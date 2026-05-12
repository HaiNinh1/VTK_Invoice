<?php

namespace App\Policies;

use App\Models\LegalDocument;
use App\Models\User;

class LegalDocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->canManage($user);
    }

    public function view(User $user, LegalDocument $legalDocument): bool
    {
        return $this->canManage($user);
    }

    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    public function update(User $user, LegalDocument $legalDocument): bool
    {
        return $this->canManage($user);
    }

    public function delete(User $user, LegalDocument $legalDocument): bool
    {
        return $this->canManage($user);
    }

    private function canManage(User $user): bool
    {
        return $user->hasRole('admin') || $user->can('catalog.manage');
    }
}
