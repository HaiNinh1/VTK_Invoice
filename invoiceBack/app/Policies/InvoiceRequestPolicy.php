<?php

namespace App\Policies;

use App\Enums\InvoiceStatus;
use App\Models\InvoiceRequest;
use App\Models\User;

class InvoiceRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAny(['invoice.view.own', 'invoice.view.center', 'invoice.view.all']);
    }

    public function view(User $user, InvoiceRequest $request): bool
    {
        if ($user->can('invoice.view.all')) {
            return true;
        }
        if ($user->can('invoice.view.center')) {
            return $user->revenue_center_id === $request->revenue_center_id;
        }
        if ($user->can('invoice.view.own')) {
            return $user->id === $request->creator_id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('invoice.create');
    }

    public function update(User $user, InvoiceRequest $request): bool
    {
        if (! $user->can('invoice.update')) {
            return false;
        }
        if ($user->id !== $request->creator_id && ! $user->hasAnyRole(['admin', 'director'])) {
            return false;
        }

        return in_array($request->status, [InvoiceStatus::Draft, InvoiceStatus::Rejected], true);
    }

    public function delete(User $user, InvoiceRequest $request): bool
    {
        if (! $user->can('invoice.delete') && ! $user->hasRole('admin')) {
            // employees can soft delete their own drafts via create permission per plan §5.2
            if (! ($user->id === $request->creator_id && $request->status === InvoiceStatus::Draft && $user->can('invoice.create'))) {
                return false;
            }
        }

        return $request->status === InvoiceStatus::Draft || $user->hasRole('admin');
    }
}
