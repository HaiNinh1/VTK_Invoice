<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 'max:10240'],
            'kind' => ['nullable', 'string', 'max:64'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('kind')) {
            $this->merge(['kind' => 'contract']);
        }
    }
}
