<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RequestResource;
use App\Models\Request as InvoiceRequest;
use App\Services\SInvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request as HttpRequest;

class SInvoiceController extends Controller
{
    public function __construct(private readonly SInvoiceService $service) {}

    /**
     * POST /api/requests/{invoiceRequest}/export
     * Only accountant/admin (policy 'approve' reused).
     */
    public function export(HttpRequest $request, InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('approve', $invoiceRequest);
        $result = $this->service->export($invoiceRequest);
        if (! $result['ok']) {
            return response()->json($result, 422);
        }
        return response()->json([
            'ok' => true,
            'sInvoiceNumber' => $result['sInvoiceNumber'],
            'data' => (new RequestResource($invoiceRequest->fresh(['sInvoice', 'creator', 'approval'])))->resolve(),
        ]);
    }

    /** POST /api/requests/{invoiceRequest}/retry-export */
    public function retry(HttpRequest $request, InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('approve', $invoiceRequest);
        $result = $this->service->retry($invoiceRequest);
        if (! $result['ok']) {
            return response()->json($result, 422);
        }
        return response()->json([
            'ok' => true,
            'sInvoiceNumber' => $result['sInvoiceNumber'],
            'data' => (new RequestResource($invoiceRequest->fresh(['sInvoice', 'creator', 'approval'])))->resolve(),
        ]);
    }
}
