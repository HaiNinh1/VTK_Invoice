<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\CreateInvoiceFromInstallmentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContractRequest;
use App\Http\Requests\StoreContractDocumentRequest;
use App\Http\Requests\StorePaymentInstallmentRequest;
use App\Http\Requests\UpdateContractRequest;
use App\Http\Requests\UpdatePaymentInstallmentRequest;
use App\Http\Resources\ContractDocumentResource;
use App\Http\Resources\ContractResource;
use App\Http\Resources\InvoiceRequestResource;
use App\Http\Resources\PaymentInstallmentResource;
use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\InvoiceRequest;
use App\Models\PaymentInstallment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Contract::class);

        $query = Contract::query()
            ->with(['customer', 'projectManager', 'revenueCenter'])
            ->withCount(['installments', 'documents'])
            ->latest();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($revenueCenterId = $request->input('revenue_center_id')) {
            $query->where('revenue_center_id', $revenueCenterId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($builder) use ($search) {
                $builder->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customer) use ($search) {
                        $customer->where('name', 'like', "%{$search}%")
                            ->orWhere('tax_code', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) min(100, max(1, (int) $request->input('per_page', 20)));

        return ContractResource::collection($query->paginate($perPage));
    }

    public function store(StoreContractRequest $request)
    {
        $this->authorize('create', Contract::class);

        $contract = Contract::create($request->validated())
            ->load(['customer', 'projectManager', 'revenueCenter'])
            ->loadCount(['installments', 'documents']);

        return (new ContractResource($contract))->response()->setStatusCode(201);
    }

    public function show(Contract $contract): ContractResource
    {
        $this->authorize('view', $contract);

        return new ContractResource($contract->load(['customer', 'projectManager', 'revenueCenter', 'installments'])
            ->loadCount(['installments', 'documents']));
    }

    public function update(UpdateContractRequest $request, Contract $contract): ContractResource
    {
        $this->authorize('update', $contract);

        $contract->update($request->validated());

        return new ContractResource($contract->load(['customer', 'projectManager', 'revenueCenter'])
            ->loadCount(['installments', 'documents']));
    }

    public function destroy(Contract $contract)
    {
        $this->authorize('delete', $contract);

        $hasActiveInvoice = InvoiceRequest::query()
            ->where('contract_id', $contract->id)
            ->whereNotIn('status', ['rejected', 'returned', 'draft'])
            ->exists();

        if ($hasActiveInvoice) {
            return response()->json(['message' => 'Contract has active invoice requests.'], 409);
        }

        $contract->delete();

        return response()->noContent();
    }

    public function installments(Contract $contract)
    {
        $this->authorize('view', $contract);

        return PaymentInstallmentResource::collection($contract->installments()->orderBy('sequence')->get());
    }

    public function storeInstallment(StorePaymentInstallmentRequest $request, Contract $contract)
    {
        $this->authorize('update', $contract);

        $data = $request->validated();
        $sequence = $data['sequence'] ?? ((int) $contract->installments()->max('sequence') + 1);

        $installment = $contract->installments()->create([
            'sequence' => $sequence,
            'name' => $data['description'] ?? "Installment {$sequence}",
            'amount' => $data['amount'],
            'due_date' => $data['due_date'],
            'status' => $data['status'] ?? 'planned',
            'notes' => $data['description'] ?? null,
        ]);

        return (new PaymentInstallmentResource($installment))->response()->setStatusCode(201);
    }

    public function updateInstallment(UpdatePaymentInstallmentRequest $request, Contract $contract, PaymentInstallment $installment): PaymentInstallmentResource
    {
        $this->authorize('update', $contract);
        $this->ensureInstallmentBelongsToContract($contract, $installment);

        $data = $request->validated();
        $installment->update([
            'sequence' => $data['sequence'] ?? $installment->sequence,
            'name' => array_key_exists('description', $data) ? ($data['description'] ?? $installment->name) : $installment->name,
            'amount' => $data['amount'] ?? $installment->amount,
            'due_date' => $data['due_date'] ?? $installment->due_date,
            'status' => $data['status'] ?? $installment->status,
            'notes' => array_key_exists('description', $data) ? $data['description'] : $installment->notes,
        ]);

        return new PaymentInstallmentResource($installment->refresh());
    }

    public function destroyInstallment(Contract $contract, PaymentInstallment $installment)
    {
        $this->authorize('update', $contract);
        $this->ensureInstallmentBelongsToContract($contract, $installment);

        if ($installment->invoiceRequests()->exists()) {
            return response()->json(['message' => 'Installment is linked to an invoice request.'], 409);
        }

        $installment->delete();

        return response()->noContent();
    }

    public function documents(Contract $contract)
    {
        $this->authorize('view', $contract);

        return ContractDocumentResource::collection($contract->documents()->latest()->get());
    }

    public function storeDocument(StoreContractDocumentRequest $request, Contract $contract)
    {
        $this->authorize('update', $contract);

        $file = $request->file('file');
        $path = $file->store("contracts/{$contract->id}", 'local');

        $document = $contract->documents()->create([
            'document_type' => $request->validated('kind') ?? 'contract',
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'file_size' => $file->getSize() ?: 0,
            'mime_type' => $file->getMimeType(),
            'uploaded_by_id' => $request->user()->id,
        ]);

        return (new ContractDocumentResource($document))->response()->setStatusCode(201);
    }

    public function destroyDocument(Contract $contract, ContractDocument $document)
    {
        $this->authorize('update', $contract);

        if ((int) $document->contract_id !== (int) $contract->id) {
            abort(404);
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->noContent();
    }

    public function createInvoiceRequest(
        Request $request,
        Contract $contract,
        PaymentInstallment $installment,
        CreateInvoiceFromInstallmentAction $action
    ): InvoiceRequestResource {
        abort_unless($request->user()->can('invoice.create'), 403);

        $invoice = $action->execute($contract, $installment, $request->user())
            ->load(['customer', 'invoiceType', 'serviceType', 'revenueCenter', 'creator']);

        return new InvoiceRequestResource($invoice);
    }

    private function ensureInstallmentBelongsToContract(Contract $contract, PaymentInstallment $installment): void
    {
        if ((int) $installment->contract_id !== (int) $contract->id) {
            abort(404);
        }
    }
}
