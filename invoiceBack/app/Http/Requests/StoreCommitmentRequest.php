<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCommitmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('commitment.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'min:10', 'max:5000'],
            'deadline' => ['required', 'date', 'after:today'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $v->validated();
        });
    }

    protected function prepareForValidation(): void
    {
        foreach (['status', 'director_decision', 'signature_snapshot_id', 'signed_at'] as $field) {
            if ($this->has($field)) {
                $this->request->remove($field);
                $this->query->remove($field);
            }
        }
    }
}
