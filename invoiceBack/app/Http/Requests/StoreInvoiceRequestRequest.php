<?php

namespace App\Http\Requests;

use App\Models\PaymentInstallment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreInvoiceRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('invoice.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'invoice_type_id' => ['required', 'integer', 'exists:invoice_types,id'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'service_type_id' => ['required', 'integer', 'exists:service_types,id'],
            'contract_id' => ['nullable', 'integer', 'exists:contracts,id'],
            'payment_installment_id' => ['nullable', 'integer', 'exists:payment_installments,id'],
            'revenue_center_id' => ['nullable', 'integer', 'exists:revenue_centers,id'],
            'contract_number' => ['nullable', 'string', 'max:64'],
            'contract_date' => ['nullable', 'date'],
            'service_content' => ['nullable', 'string', 'max:5000'],
            // `legal_complete` is computed server-side by LegalComplianceService.
            // It is intentionally not accepted from client input.
            'before_vat' => ['required', 'numeric', 'gt:0'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'after_vat' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $data = $v->validated();

            // Math check: after_vat must equal before_vat * (1 + tax_rate/100) within 0.01 đ.
            if (isset($data['before_vat'], $data['tax_rate'], $data['after_vat'])) {
                $expected = ((float) $data['before_vat']) * (1 + ((float) $data['tax_rate']) / 100);
                if (abs($expected - (float) $data['after_vat']) > 0.01) {
                    $v->errors()->add('after_vat', 'invalid_total');
                }
            }

            // Installment must belong to the referenced contract.
            if (!empty($data['payment_installment_id']) && !empty($data['contract_id'])) {
                $installment = PaymentInstallment::find($data['payment_installment_id']);
                if ($installment && (int) $installment->contract_id !== (int) $data['contract_id']) {
                    $v->errors()->add('payment_installment_id', 'installment_contract_mismatch');
                }
            }
        });
    }

    protected function prepareForValidation(): void
    {
        // Defensive: strip client-supplied legal_complete so it can never reach the model.
        if ($this->has('legal_complete')) {
            $this->request->remove('legal_complete');
            $this->query->remove('legal_complete');
        }
    }
}
