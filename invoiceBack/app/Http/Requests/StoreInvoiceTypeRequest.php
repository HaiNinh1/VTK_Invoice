<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('invoice_types', 'code')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'service_type_ids' => ['nullable', 'array'],
            'service_type_ids.*' => ['integer', 'exists:service_types,id'],
            'legal_documents' => ['nullable', 'array'],
            'legal_documents.*.legal_document_id' => ['required', 'integer', 'exists:legal_documents,id'],
            'legal_documents.*.required' => ['required', 'boolean'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $legalDocuments = collect($this->input('legal_documents', []))
            ->filter(fn ($item) => is_array($item))
            ->map(fn (array $item) => [
                'legal_document_id' => $item['legal_document_id'] ?? $item['id'] ?? null,
                'required' => array_key_exists('required', $item) ? $item['required'] : true,
            ])
            ->values()
            ->all();

        $this->merge([
            'status' => $this->input('status', 'active'),
            'legal_documents' => $legalDocuments,
        ]);
    }
}
