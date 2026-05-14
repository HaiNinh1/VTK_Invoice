<?php

namespace App\Policies;

use App\Models\Request as InvoiceRequest;
use App\Models\User;

class RequestPolicy
{
    /** All authenticated users may list. Scoping handled in controller index(). */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /** Department-scoped read: acc/admin all, manager dept-match, employee = creator. */
    public function view(User $user, InvoiceRequest $req): bool
    {
        if ($user->canSeeAllDepartments()) {
            return true;
        }
        if ($user->role === 'manager') {
            return $req->department === $user->department;
        }
        return (int) $req->created_by_id === (int) $user->id;
    }

    /** Anyone authenticated can draft a request. */
    public function create(User $user): bool
    {
        return true;
    }

    /** Edit only your own draft / returned-for-supplement request. */
    public function update(User $user, InvoiceRequest $req): bool
    {
        return (int) $req->created_by_id === (int) $user->id
            && in_array($req->status, ['Nháp', 'Trả lại bổ sung'], true);
    }

    /** Only the creator can delete, and only while still a draft. */
    public function delete(User $user, InvoiceRequest $req): bool
    {
        return (int) $req->created_by_id === (int) $user->id
            && $req->status === 'Nháp';
    }

    public function submit(User $user, InvoiceRequest $req): bool
    {
        return (int) $req->created_by_id === (int) $user->id
            && in_array($req->status, ['Nháp', 'Trả lại bổ sung'], true);
    }

    public function recall(User $user, InvoiceRequest $req): bool
    {
        return (int) $req->created_by_id === (int) $user->id
            && $req->status === 'Chờ duyệt';
    }

    /** Approve/reject/return are accountant/admin gates. */
    public function approve(User $user, InvoiceRequest $req): bool
    {
        return in_array($user->role, ['accountant', 'admin'], true);
    }

    public function reject(User $user, InvoiceRequest $req): bool
    {
        return $this->approve($user, $req);
    }

    public function returnSupplement(User $user, InvoiceRequest $req): bool
    {
        return $this->approve($user, $req);
    }
}
