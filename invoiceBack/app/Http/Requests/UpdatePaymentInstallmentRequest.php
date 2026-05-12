<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentInstallmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sequence' => ['sometimes', 'integer', 'min:1'],
            'amount' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'due_date' => ['sometimes', 'required', 'date'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', Rule::in(['planned', 'scheduled', 'invoiced', 'paid'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Keep FormRequest pattern aligned with Phase 1; no normalization needed.
    }
}
