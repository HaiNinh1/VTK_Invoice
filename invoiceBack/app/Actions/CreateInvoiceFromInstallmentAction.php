<?php

namespace App\Actions;

use App\Models\Contract;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\PaymentInstallment;
use App\Models\ServiceType;
use App\Models\User;
use App\Services\InvoiceCodeGenerator;
use Illuminate\Validation\ValidationException;

class CreateInvoiceFromInstallmentAction
{
    public function __construct(private InvoiceCodeGenerator $codes) {}

    public function execute(Contract $contract, PaymentInstallment $installment, User $actor): InvoiceRequest
    {
        if ($installment->contract_id !== $contract->id) {
            throw ValidationException::withMessages(['installment' => 'Installment does not belong to contract.']);
        }

        $taxRate = 10;
        $beforeVat = (float) $installment->amount;

        return InvoiceRequest::create([
            'request_code' => $this->codes->generate(),
            'invoice_type_id' => InvoiceType::firstOrFail()->id,
            'customer_id' => $contract->customer_id,
            'service_type_id' => ServiceType::firstOrFail()->id,
            'contract_id' => $contract->id,
            'payment_installment_id' => $installment->id,
            'contract_number' => $contract->code,
            'contract_date' => $contract->signed_date,
            'revenue_center_id' => $actor->revenue_center_id,
            'creator_id' => $actor->id,
            'department_id' => $actor->department_id,
            'before_vat' => $beforeVat,
            'tax_rate' => $taxRate,
            'after_vat' => $beforeVat * (1 + $taxRate / 100),
            'service_content' => $installment->name,
            'status' => 'draft',
            'created_by' => $actor->id,
        ]);
    }
}
