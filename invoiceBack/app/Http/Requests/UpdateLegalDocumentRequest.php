<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLegalDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $legalDocumentId = $this->route('legalDocument')?->id;

        return [
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('legal_documents', 'code')->ignore($legalDocumentId)],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'group' => ['sometimes', 'required', Rule::in(['contract', 'acceptance', 'settlement', 'payment_guarantee'])],
            'default_required' => ['nullable', 'boolean'],
            'default_deadline_days' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'enabled' => ['nullable', 'boolean'],
        ];
    }
}
