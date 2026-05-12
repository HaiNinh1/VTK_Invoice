<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ExtendCommitmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('commitment.extend') ?? false;
    }

    public function rules(): array
    {
        return [
            'days' => ['required', 'integer', 'between:1,30'],
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
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
        if ($this->has('days')) {
            $this->merge(['days' => (int) $this->input('days')]);
        }
    }
}
