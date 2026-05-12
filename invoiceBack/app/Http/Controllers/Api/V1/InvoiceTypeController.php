<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceTypeRequest;
use App\Http\Requests\UpdateInvoiceTypeRequest;
use App\Http\Resources\InvoiceTypeResource;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use Illuminate\Http\Request;

class InvoiceTypeController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', InvoiceType::class);

        $query = InvoiceType::query()
            ->with(['serviceTypes', 'legalDocuments'])
            ->withCount([
                'invoiceRequests',
                'invoiceRequests as complete_invoice_requests_count' => fn ($query) => $query->where('legal_complete', true),
            ])
            ->latest();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($builder) use ($search) {
                $builder->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) min(100, max(1, (int) $request->input('per_page', 20)));

        return InvoiceTypeResource::collection($query->paginate($perPage));
    }

    public function store(StoreInvoiceTypeRequest $request)
    {
        $this->authorize('create', InvoiceType::class);

        $invoiceType = InvoiceType::create($this->attributes($request->validated()));
        $this->syncRelations($invoiceType, $request->validated());

        return (new InvoiceTypeResource($this->loadResourceRelations($invoiceType)))->response()->setStatusCode(201);
    }

    public function show(InvoiceType $invoiceType): InvoiceTypeResource
    {
        $this->authorize('view', $invoiceType);

        return new InvoiceTypeResource($this->loadResourceRelations($invoiceType));
    }

    public function update(UpdateInvoiceTypeRequest $request, InvoiceType $invoiceType): InvoiceTypeResource
    {
        $this->authorize('update', $invoiceType);

        $invoiceType->update($this->attributes($request->validated()));
        $this->syncRelations($invoiceType, $request->validated());

        return new InvoiceTypeResource($this->loadResourceRelations($invoiceType));
    }

    public function destroy(InvoiceType $invoiceType)
    {
        $this->authorize('delete', $invoiceType);

        if (InvoiceRequest::query()->where('invoice_type_id', $invoiceType->id)->exists()) {
            return response()->json(['message' => 'Invoice type is referenced by invoice requests.'], 409);
        }

        $invoiceType->delete();

        return response()->noContent();
    }

    public function toggleStatus(InvoiceType $invoiceType): InvoiceTypeResource
    {
        $this->authorize('update', $invoiceType);

        $invoiceType->update([
            'status' => $invoiceType->status === 'active' ? 'inactive' : 'active',
        ]);

        return new InvoiceTypeResource($this->loadResourceRelations($invoiceType));
    }

    private function attributes(array $data): array
    {
        return collect($data)->only(['code', 'name', 'description', 'status'])->all();
    }

    private function syncRelations(InvoiceType $invoiceType, array $data): void
    {
        if (array_key_exists('service_type_ids', $data)) {
            $invoiceType->serviceTypes()->sync($data['service_type_ids'] ?? []);
        }

        if (array_key_exists('legal_documents', $data)) {
            $sync = collect($data['legal_documents'] ?? [])
                ->mapWithKeys(fn (array $document) => [
                    $document['legal_document_id'] => ['required' => (bool) $document['required']],
                ])
                ->all();

            $invoiceType->legalDocuments()->sync($sync);
        }
    }

    private function loadResourceRelations(InvoiceType $invoiceType): InvoiceType
    {
        return $invoiceType->load(['serviceTypes', 'legalDocuments'])
            ->loadCount([
                'invoiceRequests',
                'invoiceRequests as complete_invoice_requests_count' => fn ($query) => $query->where('legal_complete', true),
            ]);
    }
}
