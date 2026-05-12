<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentInstallmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sequence' => ['nullable', 'integer', 'min:1'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'due_date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', Rule::in(['planned', 'scheduled', 'invoiced', 'paid'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('status')) {
            $this->merge(['status' => 'planned']);
        }
    }
}
