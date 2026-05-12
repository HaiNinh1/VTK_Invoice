<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $serviceTypeId = $this->route('serviceType')?->id;

        return [
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('service_types', 'code')->ignore($serviceTypeId)],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
