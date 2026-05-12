<?php

namespace App\Http\Requests;

use App\Models\PaymentInstallment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateInvoiceRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy enforced in controller
    }

    public function rules(): array
    {
        return [
            'invoice_type_id' => ['sometimes', 'integer', 'exists:invoice_types,id'],
            'customer_id' => ['sometimes', 'integer', 'exists:customers,id'],
            'service_type_id' => ['sometimes', 'integer', 'exists:service_types,id'],
            'contract_id' => ['nullable', 'integer', 'exists:contracts,id'],
            'payment_installment_id' => ['nullable', 'integer', 'exists:payment_installments,id'],
            'contract_number' => ['nullable', 'string', 'max:64'],
            'contract_date' => ['nullable', 'date'],
            'service_content' => ['nullable', 'string', 'max:5000'],
            // `legal_complete` is computed server-side; never accepted from client.
            'before_vat' => ['sometimes', 'numeric', 'gt:0'],
            'tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'after_vat' => ['sometimes', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $data = $v->validated();

            // Resolve effective values: merge input with the existing record so
            // partial updates still validate the math invariant.
            $invoice = $this->route('invoiceRequest');
            $beforeVat = array_key_exists('before_vat', $data) ? (float) $data['before_vat'] : (float) ($invoice->before_vat ?? 0);
            $taxRate = array_key_exists('tax_rate', $data) ? (float) $data['tax_rate'] : (float) ($invoice->tax_rate ?? 0);
            $afterVat = array_key_exists('after_vat', $data) ? (float) $data['after_vat'] : (float) ($invoice->after_vat ?? 0);

            if ($beforeVat > 0 && $afterVat > 0) {
                $expected = $beforeVat * (1 + $taxRate / 100);
                if (abs($expected - $afterVat) > 0.01) {
                    $v->errors()->add('after_vat', 'invalid_total');
                }
            }

            // Installment must belong to the referenced contract.
            $contractId = array_key_exists('contract_id', $data) ? $data['contract_id'] : ($invoice->contract_id ?? null);
            $installmentId = array_key_exists('payment_installment_id', $data) ? $data['payment_installment_id'] : null;
            if ($installmentId && $contractId) {
                $installment = PaymentInstallment::find($installmentId);
                if ($installment && (int) $installment->contract_id !== (int) $contractId) {
                    $v->errors()->add('payment_installment_id', 'installment_contract_mismatch');
                }
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('legal_complete')) {
            $this->request->remove('legal_complete');
            $this->query->remove('legal_complete');
        }
    }
}
