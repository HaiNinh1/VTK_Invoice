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
    public function __construct(protected ApprovalService $approvals) {}

    public function submit(Request $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $updated = $this->approvals->submit($invoiceRequest, $request->user());

        return new InvoiceRequestResource($updated);
    }

    public function approve(ApprovalActionRequest $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $updated = $this->approvals->approve($invoiceRequest, $request->user(), $request->input('comment'));

        return new InvoiceRequestResource($updated);
    }

    public function reject(ApprovalActionRequest $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $updated = $this->approvals->reject($invoiceRequest, $request->user(), $request->input('comment'));

        return new InvoiceRequestResource($updated);
    }
}
