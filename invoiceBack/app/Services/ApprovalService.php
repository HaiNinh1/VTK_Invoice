<?php

namespace App\Services;

use App\Enums\ApprovalAction;
use App\Enums\ApprovalStep;
use App\Enums\InvoiceStatus;
use App\Models\Approval;
use App\Models\InvoiceRequest;
use App\Models\SignatureSnapshot;
use App\Models\User;
use App\Notifications\InvoicePendingApprovalNotification;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class ApprovalService
{
    public function __construct(protected LegalComplianceService $compliance) {}

    /**
     * Move a draft/returned request to the correct approval branch. Creator only.
     */
    public function submit(InvoiceRequest $request, User $actor): InvoiceRequest
    {
        if ($request->creator_id !== $actor->id && ! $actor->hasRole('admin')) {
            throw new AuthorizationException('Only the creator may submit this request.');
        }
        if (! in_array($request->status, [InvoiceStatus::Draft, InvoiceStatus::Returned], true)) {
            throw new AuthorizationException('Request is not in a submittable state.');
        }

        return DB::transaction(function () use ($request, $actor) {
            // Always recompute compliance at the moment of submission. Stops a
            // race where the client uploads/removes a legal document and submits
            // before the cache is refreshed.
            $this->compliance->refresh($request);
            $request->refresh();

            $step = $request->legal_complete
                ? ApprovalStep::Accountant
                : ApprovalStep::Director;

            if (! $request->legal_complete && ! $request->commitments()->exists()) {
                throw new AuthorizationException('Hồ sơ pháp lý chưa đầy đủ. Vui lòng tạo cam kết bổ sung.');
            }

            $handler = $this->nextHandler($step);

            $request->status = $step->requiresStatus();
            $request->current_handler_id = $handler?->id;
            $request->approved_by_id = null;
            $request->return_reason = null;
            $request->rejection_reason = null;
            $request->save();

            $this->notifyApprovers($request, $step, $actor);

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

            $this->snapshotSignature($actor);

            $request->status = $step->approvedStatus();
            $request->current_handler_id = null;
            $request->approved_by_id = $actor->id;
            $request->save();

            if ($request->creator) {
                $request->creator->notify(new InvoicePendingApprovalNotification($request, 'approved'));
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

            $this->snapshotSignature($actor);

            $request->status = InvoiceStatus::Rejected;
            $request->current_handler_id = null;
            $request->rejection_reason = $comment;
            $request->save();

            if ($request->creator) {
                $request->creator->notify(new InvoicePendingApprovalNotification($request, 'rejected'));
            }

            return $request->fresh();
        });
    }

    public function returnForSupplement(InvoiceRequest $request, User $actor, string $reason): InvoiceRequest
    {
        $step = $this->expectedStepForActor($request, $actor);

        return DB::transaction(function () use ($request, $actor, $step, $reason) {
            Approval::updateOrCreate(
                ['invoice_request_id' => $request->id, 'step' => $step->value],
                [
                    'approver_id' => $actor->id,
                    'action' => ApprovalAction::Returned->value,
                    'comment' => $reason,
                    'acted_at' => now(),
                ]
            );

            $this->snapshotSignature($actor);

            $request->status = InvoiceStatus::Returned;
            $request->current_handler_id = $request->creator_id;
            $request->return_reason = $reason;
            $request->save();

            if ($request->creator) {
                $request->creator->notify(new InvoicePendingApprovalNotification($request, 'returned'));
            }

            return $request->fresh();
        });
    }

    /**
     * Determine which step `actor` is responsible for given the current request status.
     * Enforces both the permission for the step AND the per-request handler assignment.
     */
    public function expectedStepForActor(InvoiceRequest $request, User $actor): ApprovalStep
    {
        $status = $request->status;

        if ($status === InvoiceStatus::Pending) {
            $step = ApprovalStep::Accountant;
        } elseif ($status === InvoiceStatus::PendingVpgd) {
            $step = ApprovalStep::Director;
        } else {
            throw new AuthorizationException('Request is not awaiting approval.');
        }

        if (! $actor->can($step->permission())) {
            throw new AuthorizationException("You lack permission {$step->permission()} for this step.");
        }

        $this->assertAssignedHandler($request, $actor);

        return $step;
    }

    /**
     * Ensure that the actor is the specifically assigned handler for the
     * request, unless they are an admin (override) or no handler is assigned
     * (open queue mode).
     */
    protected function assertAssignedHandler(InvoiceRequest $request, User $actor): void
    {
        if ($actor->hasRole('admin')) {
            return; // admin override
        }

        if ($request->current_handler_id === null) {
            return; // open queue: any permitted user may act
        }

        if ((int) $request->current_handler_id !== (int) $actor->id) {
            throw new AuthorizationException('not_assigned_handler');
        }
    }

    protected function notifyApprovers(InvoiceRequest $request, ApprovalStep $step, User $actor): void
    {
        $approvers = User::permission($step->permission())
            ->where('is_active', true)
            ->get();

        foreach ($approvers as $approver) {
            if ($approver->id === $actor->id) {
                continue;
            }
            $approver->notify(new InvoicePendingApprovalNotification($request, 'pending'));
        }
    }

    protected function nextHandler(ApprovalStep $step): ?User
    {
        return User::permission($step->permission())
            ->where('is_active', true)
            ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'admin'))
            ->oldest('id')
            ->first();
    }

    protected function snapshotSignature(User $actor): SignatureSnapshot
    {
        $signature = $actor->signature;

        if (! $signature) {
            throw new AuthorizationException('signature_required');
        }

        return SignatureSnapshot::create([
            'user_id' => $actor->id,
            'signature_method' => $signature->method,
            'data_path' => $signature->data_path,
            'created_at' => now(),
        ]);
    }
}
