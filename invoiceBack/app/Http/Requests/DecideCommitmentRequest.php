<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class DecideCommitmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('commitment.approve') ?? false;
    }

    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::in(['accepted', 'rejected'])],
            'note' => ['required_if:decision,rejected', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $data = $v->validated();

            if (($data['decision'] ?? null) === 'rejected' && trim((string) ($data['note'] ?? '')) === '') {
                $v->errors()->add('note', 'rejection_note_required');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('decision')) {
            $this->merge(['decision' => strtolower((string) $this->input('decision'))]);
        }
    }
}
