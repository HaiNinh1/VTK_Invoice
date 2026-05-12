<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('invoice.create') || $this->user()?->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'tax_code' => ['required', 'string', 'max:50', 'unique:customers,tax_code'],
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
