<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLegalDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('legal_documents', 'code')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'group' => ['required', Rule::in(['contract', 'acceptance', 'settlement', 'payment_guarantee'])],
            'default_required' => ['nullable', 'boolean'],
            'default_deadline_days' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'enabled' => ['nullable', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'group' => $this->input('group', 'contract'),
            'default_required' => $this->input('default_required', true),
            'enabled' => $this->input('enabled', true),
        ]);
    }
}
