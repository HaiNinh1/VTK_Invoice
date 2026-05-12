<?php

namespace App\Services\Contracts;

use App\Models\Contract;

class ContractAggregateService
{
    /**
     * Synchronously recompute contract invoice/payment aggregates so API reads
     * immediately reflect workflow and CRUD changes without queue latency.
     */
    public function recompute(Contract $contract): Contract
    {
        $contract->total_invoiced = $contract->invoiceRequests()
            ->whereIn('status', ['approved', 'issued', 'accounted'])
            ->sum('after_vat');
        $contract->total_paid = $contract->invoiceRequests()
            ->where('status', 'accounted')
            ->sum('after_vat');
        $contract->saveQuietly();

        return $contract->refresh();
    }
}
