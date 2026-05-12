<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'contract_id' => ['nullable', 'integer'],
            'payment_installment_id' => ['nullable', 'integer'],
            'contract_number' => ['nullable', 'string', 'max:64'],
            'contract_date' => ['nullable', 'date'],
            'service_content' => ['nullable', 'string', 'max:5000'],
            'legal_complete' => ['sometimes', 'boolean'],
            'before_vat' => ['sometimes', 'numeric', 'gt:0'],
            'tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'after_vat' => ['sometimes', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
