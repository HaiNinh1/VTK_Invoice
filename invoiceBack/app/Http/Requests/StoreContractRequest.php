<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:64', Rule::unique('contracts', 'code')],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'name' => ['required', 'string', 'max:255'],
            'total_amount' => ['required', 'numeric', 'gte:0'],
            'total_value_after_tax' => ['nullable', 'numeric', 'gte:total_amount'],
            'signed_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:signed_date'],
            'project_manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'revenue_center_id' => ['nullable', 'integer', 'exists:revenue_centers,id'],
            'status' => ['nullable', Rule::in(['draft', 'active', 'completed', 'terminated'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('status')) {
            $this->merge(['status' => 'draft']);
        }
    }
}
