<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'contract_id' => ['nullable', 'integer'],
            'payment_installment_id' => ['nullable', 'integer'],
            'revenue_center_id' => ['nullable', 'integer', 'exists:revenue_centers,id'],
            'contract_number' => ['nullable', 'string', 'max:64'],
            'contract_date' => ['nullable', 'date'],
            'service_content' => ['nullable', 'string', 'max:5000'],
            'legal_complete' => ['nullable', 'boolean'],
            'before_vat' => ['required', 'numeric', 'gt:0'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'after_vat' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
