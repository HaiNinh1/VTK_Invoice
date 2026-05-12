<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\DecideCommitmentRequest;
use App\Http\Requests\ExtendCommitmentRequest;
use App\Http\Requests\StoreCommitmentRequest;
use App\Http\Resources\CommitmentResource;
use App\Models\Commitment;
use App\Models\InvoiceRequest;
use Illuminate\Http\Request;

class CommitmentController extends Controller
{
    public function index(Request $request, InvoiceRequest $invoiceRequest)
    {
        $this->authorize('view', $invoiceRequest);

        $perPage = (int) min(100, max(1, (int) $request->input('per_page', 20)));
        $commitments = $invoiceRequest->commitments()
            ->with(['invoiceRequest', 'signer', 'director', 'signatureSnapshot'])
            ->latest()
            ->paginate($perPage)
            ->appends($request->query());

        return CommitmentResource::collection($commitments);
    }

    public function store(StoreCommitmentRequest $request, InvoiceRequest $invoiceRequest): CommitmentResource
    {
        $this->authorize('view', $invoiceRequest);

        $commitment = $this->service()->create($invoiceRequest, $request->user(), $request->validated());

        return new CommitmentResource($commitment->load('invoiceRequest'));
    }

    public function show(Commitment $commitment): CommitmentResource
    {
        $commitment->load('invoiceRequest');
        $this->authorize('view', $commitment->invoiceRequest);

        return new CommitmentResource($commitment->load(['signer', 'director', 'signatureSnapshot']));
    }

    public function extend(ExtendCommitmentRequest $request, Commitment $commitment): CommitmentResource
    {
        $commitment->load('invoiceRequest');
        $this->authorize('view', $commitment->invoiceRequest);

        $commitment = $this->service()->extend(
            $commitment,
            (int) $request->validated('days'),
            (string) $request->validated('reason'),
            $request->user(),
        );

        return new CommitmentResource($commitment->load('invoiceRequest'));
    }

    public function decide(DecideCommitmentRequest $request, Commitment $commitment): CommitmentResource
    {
        $commitment->load('invoiceRequest');
        $this->authorize('view', $commitment->invoiceRequest);

        $commitment = $this->service()->decide(
            $commitment,
            (string) $request->validated('decision'),
            $request->validated('note'),
            $request->user(),
        );

        return new CommitmentResource($commitment->load('invoiceRequest'));
    }

    public function remind(Request $request, Commitment $commitment): CommitmentResource
    {
        abort_unless($request->user()?->can('commitment.remind'), 403);

        $commitment->load('invoiceRequest');
        $this->authorize('view', $commitment->invoiceRequest);

        $commitment = $this->service()->remind($commitment, $request->user());

        return new CommitmentResource($commitment->load('invoiceRequest'));
    }

    private function service(): object
    {
        return app(\App\Services\CommitmentService::class);
    }
}
