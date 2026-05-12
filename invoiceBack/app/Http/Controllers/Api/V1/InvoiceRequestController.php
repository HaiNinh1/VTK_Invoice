<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequestRequest;
use App\Http\Requests\UpdateInvoiceRequestRequest;
use App\Http\Resources\InvoiceRequestResource;
use App\Models\InvoiceRequest;
use App\Services\InvoiceCodeGenerator;
use App\Services\LegalComplianceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InvoiceRequestController extends Controller
{
    public function __construct(
        protected InvoiceCodeGenerator $codeGenerator,
        protected LegalComplianceService $compliance,
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', InvoiceRequest::class);

        $user = $request->user();

        $query = InvoiceRequest::query()
            ->with(['customer', 'invoiceType', 'serviceType', 'revenueCenter', 'creator', 'commitments'])
            ->visibleTo($user);

        $builder = QueryBuilder::for($query)
            ->allowedFilters(...[
                AllowedFilter::exact('status'),
                AllowedFilter::exact('revenue_center_id'),
                AllowedFilter::exact('service_type_id'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::exact('creator_id'),
                AllowedFilter::partial('request_code'),
                AllowedFilter::callback('search', function ($q, $value) {
                    $q->where(function ($qq) use ($value) {
                        $qq->where('request_code', 'like', "%{$value}%")
                            ->orWhere('invoice_no', 'like', "%{$value}%")
                            ->orWhere('notes', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::callback('legal_incomplete', function ($q, $value) {
                    if (filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                        $q->where('legal_complete', false);
                    }
                }),
            ])
            ->allowedSorts(...['created_at', 'request_code', 'after_vat', 'status'])
            ->defaultSort('-created_at');

        $perPage = (int) min(100, max(1, (int) $request->input('per_page', 20)));
        $page = $builder->paginate($perPage)->appends($request->query());

        return InvoiceRequestResource::collection($page);
    }

    public function show(InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $this->authorize('view', $invoiceRequest);
        $invoiceRequest->load(['customer', 'invoiceType', 'serviceType', 'revenueCenter', 'creator', 'documents', 'approvals', 'commitments']);

        return new InvoiceRequestResource($invoiceRequest);
    }

    public function store(StoreInvoiceRequestRequest $request): InvoiceRequestResource
    {
        $user = $request->user();
        $data = $request->validated();

        $invoice = new InvoiceRequest($data);
        $invoice->request_code = $this->codeGenerator->generate();
        $invoice->creator_id = $user->id;
        $invoice->created_by = $user->id;
        $invoice->department_id = $user->department_id;
        $invoice->revenue_center_id = $data['revenue_center_id'] ?? $user->revenue_center_id;
        $invoice->status = 'draft';
        $invoice->save();

        $this->compliance->refresh($invoice);

        $invoice->load(['customer', 'invoiceType', 'serviceType', 'revenueCenter', 'creator', 'commitments']);

        return new InvoiceRequestResource($invoice);
    }

    public function update(UpdateInvoiceRequestRequest $request, InvoiceRequest $invoiceRequest): InvoiceRequestResource
    {
        $this->authorize('update', $invoiceRequest);
        $data = $request->validated();
        $originalTypeId = $invoiceRequest->invoice_type_id;
        $invoiceRequest->fill($data);
        $invoiceRequest->updated_by = $request->user()->id;
        $invoiceRequest->save();

        // Refresh compliance after every update; cheap and guarantees correctness
        // when invoice_type_id changes (different required document set).
        $this->compliance->refresh($invoiceRequest);

        $invoiceRequest->load(['customer', 'invoiceType', 'serviceType', 'revenueCenter', 'creator', 'commitments']);

        return new InvoiceRequestResource($invoiceRequest);
    }

    public function destroy(InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('delete', $invoiceRequest);
        $invoiceRequest->delete();

        return response()->json(null, 204);
    }
}
