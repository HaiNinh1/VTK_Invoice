<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInvoiceTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $invoiceTypeId = $this->route('invoiceType')?->id;

        return [
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('invoice_types', 'code')->ignore($invoiceTypeId)],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
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
        if (! $this->has('legal_documents')) {
            return;
        }

        $legalDocuments = collect($this->input('legal_documents', []))
            ->filter(fn ($item) => is_array($item))
            ->map(fn (array $item) => [
                'legal_document_id' => $item['legal_document_id'] ?? $item['id'] ?? null,
                'required' => array_key_exists('required', $item) ? $item['required'] : true,
            ])
            ->values()
            ->all();

        $this->merge(['legal_documents' => $legalDocuments]);
    }
}
