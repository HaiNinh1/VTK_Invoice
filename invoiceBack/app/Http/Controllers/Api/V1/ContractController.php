<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\CreateInvoiceFromInstallmentAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\ContractResource;
use App\Http\Resources\InvoiceRequestResource;
use App\Http\Resources\PaymentInstallmentResource;
use App\Models\Contract;
use App\Models\PaymentInstallment;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Contract::class);

        $query = Contract::query()->with('customer')->latest();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $perPage = (int) min(100, max(1, (int) $request->input('per_page', 20)));

        return ContractResource::collection($query->paginate($perPage));
    }

    public function show(Contract $contract): ContractResource
    {
        $this->authorize('view', $contract);

        return new ContractResource($contract->load(['customer', 'installments']));
    }

    public function installments(Contract $contract)
    {
        $this->authorize('view', $contract);

        return PaymentInstallmentResource::collection($contract->installments()->orderBy('sequence')->get());
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
}
