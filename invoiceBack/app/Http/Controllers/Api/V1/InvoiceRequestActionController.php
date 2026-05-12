<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApprovalActionRequest;
use App\Http\Resources\InvoiceRequestResource;
use App\Models\InvoiceRequest;
use App\Services\ApprovalService;
use Illuminate\Http\Request;

class InvoiceRequestActionController extends Controller
{
    /**
     * Relations consistently returned with workflow-action responses so the
     * client receives nested customer/service_type/revenue_center objects on
     * every approve/reject/return/submit call (plan §1.6).
     */
    protected const RESPONSE_RELATIONS = [
        'customer',
        'serviceType',
        'revenueCenter',
        'invoiceType',
        'creator',
    ];

    public function __construct(protected ApprovalService $approvals) {}

    public function submit(Request $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $updated = $this->approvals->submit($invoiceRequest, $request->user());

        return new InvoiceRequestResource($this->withRelations($updated));
    }

    public function approve(ApprovalActionRequest $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $updated = $this->approvals->approve($invoiceRequest, $request->user(), $request->input('comment'));

        return new InvoiceRequestResource($this->withRelations($updated));
    }

    public function reject(ApprovalActionRequest $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $updated = $this->approvals->reject($invoiceRequest, $request->user(), $request->input('comment'));

        return new InvoiceRequestResource($this->withRelations($updated));
    }

    public function return(ApprovalActionRequest $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $updated = $this->approvals->returnForSupplement($invoiceRequest, $request->user(), $validated['reason']);

        return new InvoiceRequestResource($this->withRelations($updated));
    }

    public function resubmit(Request $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $updated = $this->approvals->submit($invoiceRequest, $request->user());

        return new InvoiceRequestResource($this->withRelations($updated));
    }

    protected function withRelations(InvoiceRequest $invoiceRequest): InvoiceRequest
    {
        return $invoiceRequest->loadMissing(self::RESPONSE_RELATIONS);
    }
}
