<?php

namespace App\Observers;

use App\Models\Contract;
use App\Models\InvoiceRequest;
use App\Services\Contracts\ContractAggregateService;

class InvoiceRequestObserver
{
    public function saved(InvoiceRequest $invoiceRequest): void
    {
        $this->recomputeContract($invoiceRequest->contract_id);

        $originalContractId = $invoiceRequest->getOriginal('contract_id');
        if ($originalContractId && (int) $originalContractId !== (int) $invoiceRequest->contract_id) {
            $this->recomputeContract($originalContractId);
        }
    }

    public function deleted(InvoiceRequest $invoiceRequest): void
    {
        $this->recomputeContract($invoiceRequest->contract_id);
    }

    private function recomputeContract(null|int|string $contractId): void
    {
        if (! $contractId) {
            return;
        }

        $contract = Contract::find($contractId);
        if ($contract) {
            app(ContractAggregateService::class)->recompute($contract);
        }
    }
}
