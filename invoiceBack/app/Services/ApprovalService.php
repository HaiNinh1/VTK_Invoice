<?php

namespace App\Services;

use App\Enums\ApprovalAction;
use App\Enums\ApprovalStep;
use App\Enums\InvoiceStatus;
use App\Models\Approval;
use App\Models\InvoiceRequest;
use App\Models\User;
use App\Notifications\InvoicePendingApprovalNotification;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class ApprovalService
{
    /**
     * Move a draft/rejected request to pending. Creator only.
     */
    public function submit(InvoiceRequest $request, User $actor): InvoiceRequest
    {
        if ($request->creator_id !== $actor->id) {
            throw new AuthorizationException('Only the creator may submit this request.');
        }
        if (! in_array($request->status, [InvoiceStatus::Draft, InvoiceStatus::Rejected], true)) {
            throw new AuthorizationException('Request is not in a submittable state.');
        }

        return DB::transaction(function () use ($request, $actor) {
            $request->status = InvoiceStatus::Pending;
            $request->save();

            $this->notifyApprovers($request, ApprovalStep::Department, $actor);

            return $request->fresh();
        });
    }

    /**
     * Approve at the current expected step for the actor's role.
     */
    public function approve(InvoiceRequest $request, User $actor, ?string $comment = null): InvoiceRequest
    {
        $step = $this->expectedStepForActor($request, $actor);

        return DB::transaction(function () use ($request, $actor, $step, $comment) {
            Approval::updateOrCreate(
                ['invoice_request_id' => $request->id, 'step' => $step->value],
                [
                    'approver_id' => $actor->id,
                    'action' => ApprovalAction::Approved->value,
                    'comment' => $comment,
                    'acted_at' => now(),
                ]
            );

            $request->status = $step->approvedStatus();
            $request->save();

            // Notify next approver if any
            $nextStep = match ($step) {
                ApprovalStep::Department => ApprovalStep::Accountant,
                ApprovalStep::Accountant => ApprovalStep::Director,
                ApprovalStep::Director => null,
            };
            if ($nextStep) {
                $this->notifyApprovers($request, $nextStep, $actor);
            } else {
                // Notify creator that request was fully approved
                if ($request->creator) {
                    $request->creator->notify(new InvoicePendingApprovalNotification($request, 'approved'));
                }
            }

            return $request->fresh();
        });
    }

    public function reject(InvoiceRequest $request, User $actor, ?string $comment = null): InvoiceRequest
    {
        $step = $this->expectedStepForActor($request, $actor);

        return DB::transaction(function () use ($request, $actor, $step, $comment) {
            Approval::updateOrCreate(
                ['invoice_request_id' => $request->id, 'step' => $step->value],
                [
                    'approver_id' => $actor->id,
                    'action' => ApprovalAction::Rejected->value,
                    'comment' => $comment,
                    'acted_at' => now(),
                ]
            );

            $request->status = InvoiceStatus::Rejected;
            $request->save();

            if ($request->creator) {
                $request->creator->notify(new InvoicePendingApprovalNotification($request, 'rejected'));
            }

            return $request->fresh();
        });
    }

    /**
     * Determine which step `actor` is responsible for given the current request status.
     */
    public function expectedStepForActor(InvoiceRequest $request, User $actor): ApprovalStep
    {
        $status = $request->status;

        if ($status === InvoiceStatus::Pending) {
            $step = ApprovalStep::Department;
        } elseif ($status === InvoiceStatus::PendingVpgd) {
            // Accountant acts first, then director
            $accountantDone = $request->approvals()
                ->where('step', ApprovalStep::Accountant->value)
                ->where('action', ApprovalAction::Approved->value)
                ->exists();
            $step = $accountantDone ? ApprovalStep::Director : ApprovalStep::Accountant;
        } else {
            throw new AuthorizationException('Request is not awaiting approval.');
        }

        if (! $actor->can($step->permission())) {
            throw new AuthorizationException("You lack permission {$step->permission()} for this step.");
        }
        // Manager scoping: must be same revenue center for department step
        if ($step === ApprovalStep::Department
            && $actor->hasRole('manager')
            && $actor->revenue_center_id !== $request->revenue_center_id) {
            throw new AuthorizationException('Manager may only approve own revenue center.');
        }

        return $step;
    }

    protected function notifyApprovers(InvoiceRequest $request, ApprovalStep $step, User $actor): void
    {
        $approvers = User::permission($step->permission())
            ->where('is_active', true)
            ->when($step === ApprovalStep::Department, function ($q) use ($request) {
                $q->where(function ($qq) use ($request) {
                    $qq->where('revenue_center_id', $request->revenue_center_id)
                        ->orWhereHas('roles', fn ($r) => $r->where('name', 'admin'));
                });
            })
            ->get();

        foreach ($approvers as $approver) {
            if ($approver->id === $actor->id) {
                continue;
            }
            $approver->notify(new InvoicePendingApprovalNotification($request, 'pending'));
        }
    }
}
