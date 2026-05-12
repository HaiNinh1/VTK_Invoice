<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('invoice.create') || $this->user()?->hasRole('admin');
    }

    public function rules(): array
    {
        $customer = $this->route('customer');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'tax_code' => ['sometimes', 'string', 'max:50', Rule::unique('customers', 'tax_code')->ignore($customer?->id)],
            'address' => ['nullable', 'string', 'max:500'],
            'contact_name' => ['nullable', 'string', 'max:200'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_email' => ['nullable', 'email', 'max:200'],
            'buyer_name' => ['nullable', 'string', 'max:200'],
            'buyer_email' => ['nullable', 'email', 'max:200'],
            'buyer_phone' => ['nullable', 'string', 'max:50'],
        ];
    }
}
