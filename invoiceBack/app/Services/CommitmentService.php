<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Models\Commitment;
use App\Models\InvoiceRequest;
use App\Models\SignatureSnapshot;
use App\Models\User;
use App\Notifications\CommitmentReminderNotification;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class CommitmentService
{
    public function create(InvoiceRequest $invoiceRequest, User $actor, array $data): Commitment
    {
        if (! in_array($invoiceRequest->status, [InvoiceStatus::Draft, InvoiceStatus::Returned], true)) {
            throw new AuthorizationException('commitment_invoice_not_editable');
        }

        if ($invoiceRequest->creator_id !== $actor->id && ! $actor->hasRole('admin')) {
            throw new AuthorizationException('commitment_creator_required');
        }

        return DB::transaction(function () use ($invoiceRequest, $actor, $data) {
            $snapshot = $this->snapshotSignature($actor);
            $missingDocuments = app(LegalComplianceService::class)->missingDocuments($invoiceRequest);

            return Commitment::create([
                'invoice_request_id' => $invoiceRequest->id,
                'code' => $this->generateCode(),
                'content' => $data['content'],
                'missing_documents' => $missingDocuments,
                'signature_snapshot_id' => $snapshot->id,
                'director_decision' => 'pending',
                'extensions' => [],
                'status' => 'pending',
                'deadline' => $data['deadline'],
                'created_by' => $actor->id,
                'signer_id' => $actor->id,
                'signed_at' => now(),
            ]);
        });
    }

    public function extend(Commitment $commitment, int $days, string $reason, User $actor): Commitment
    {
        if (in_array($commitment->status, ['fulfilled', 'rejected'], true)) {
            throw new AuthorizationException('commitment_closed');
        }

        $extensions = $commitment->extensions ?? [];
        $maxExtensions = (int) config('commitments.max_extensions', 2);

        if (count($extensions) >= $maxExtensions) {
            throw new HttpResponseException(response()->json([
                'message' => 'max_extensions_exceeded',
                'errors' => ['extensions' => ['max_extensions_exceeded']],
            ], 422));
        }

        $before = $commitment->deadline?->copy() ?? now()->startOfDay();
        $after = $before->copy()->addDays($days);
        $extensions[] = [
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'before' => $before->toDateString(),
            'after' => $after->toDateString(),
            'reason' => $reason,
            'timestamp' => now()->toIso8601String(),
        ];

        $commitment->extensions = $extensions;
        $commitment->deadline = $after;
        $commitment->status = 'extended';
        $commitment->save();

        return $commitment->fresh();
    }

    public function decide(Commitment $commitment, string $decision, ?string $note, User $actor): Commitment
    {
        return DB::transaction(function () use ($commitment, $decision, $note, $actor) {
            $snapshot = $this->snapshotSignature($actor);

            $commitment->director_id = $actor->id;
            $commitment->director_decision = $decision;
            $commitment->director_note = $note;
            $commitment->signature_snapshot_id = $snapshot->id;
            $commitment->status = $decision === 'accepted' ? 'fulfilled' : 'rejected';
            $commitment->save();

            if ($decision === 'rejected') {
                app(ApprovalService::class)->returnForSupplement(
                    $commitment->invoiceRequest,
                    $actor,
                    "Commitment rejected: {$note}",
                );
            }

            return $commitment->fresh();
        });
    }

    public function remind(Commitment $commitment, User $actor): Commitment
    {
        $recipient = $commitment->signer ?: $commitment->invoiceRequest?->creator;

        if ($recipient) {
            $recipient->notify(new CommitmentReminderNotification($commitment, $actor));
        }

        return $commitment->fresh();
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

    protected function generateCode(): string
    {
        $year = now()->year;
        $sequence = Commitment::whereYear('created_at', $year)->count() + 1;

        return sprintf('CK-%d-%05d', $year, $sequence);
    }
}
