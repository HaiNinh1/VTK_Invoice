<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RequestResource;
use App\Models\Request as InvoiceRequest;
use App\Services\RequestStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request as HttpRequest;

/**
 * State-transition endpoints. Each returns FE-shape {ok, reason?} alongside
 * a refreshed RequestResource so the UI can re-render without a second fetch.
 */
class RequestActionController extends Controller
{
    public function __construct(private readonly RequestStateMachine $sm) {}

    public function submit(HttpRequest $request, InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('submit', $invoiceRequest);
        $res = $this->sm->submit($invoiceRequest);
        return $this->respond($res, $invoiceRequest);
    }

    public function recall(HttpRequest $request, InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('recall', $invoiceRequest);
        $res = $this->sm->recall($invoiceRequest, $request->user());
        return $this->respond($res, $invoiceRequest);
    }

    public function approve(HttpRequest $request, InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('approve', $invoiceRequest);

        $data = $request->validate([
            'accountingRefNo' => ['required', 'string', 'max:60'],
            'accountRevenue' => ['nullable', 'string', 'max:20'],
            'accountTax' => ['nullable', 'string', 'max:20'],
            'accountReceivable' => ['nullable', 'string', 'max:20'],
            'approvalNote' => ['nullable', 'string'],
        ], [
            'accountingRefNo.required' => 'Vui lòng nhập số chứng từ ghi sổ',
        ]);

        $res = $this->sm->approve($invoiceRequest, $request->user(), $data);
        return $this->respond($res, $invoiceRequest);
    }

    public function reject(HttpRequest $request, InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('reject', $invoiceRequest);
        $data = $request->validate([
            'reason' => ['required', 'string'],
        ], ['reason.required' => 'Vui lòng nhập lý do từ chối']);

        $res = $this->sm->reject($invoiceRequest, $request->user(), $data['reason']);
        return $this->respond($res, $invoiceRequest);
    }

    public function returnSupplement(HttpRequest $request, InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('returnSupplement', $invoiceRequest);
        $data = $request->validate([
            'reason' => ['required', 'string'],
        ], ['reason.required' => 'Vui lòng nhập lý do trả lại']);

        $res = $this->sm->returnForSupplement($invoiceRequest, $request->user(), $data['reason']);
        return $this->respond($res, $invoiceRequest);
    }

    private function respond(array $res, InvoiceRequest $req): JsonResponse
    {
        if (! ($res['ok'] ?? false)) {
            return response()->json($res, 422);
        }
        $req->refresh()->load(['creator', 'approval.approver', 'sInvoice']);
        return response()->json([
            'ok' => true,
            'data' => (new RequestResource($req))->resolve(),
        ]);
    }
}
