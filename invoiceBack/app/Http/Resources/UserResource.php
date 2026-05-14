<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /** Vietnamese labels matching FE ROLE_LABELS. */
    private const ROLE_LABELS = [
        'employee' => 'Nhân viên',
        'manager' => 'Quản lý',
        'accountant' => 'Kế toán',
        'admin' => 'Quản trị viên',
    ];

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,                        // 'u{id}' for FE compatibility
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'roleLabel' => self::ROLE_LABELS[$this->role] ?? $this->role,
            'department' => $this->department,
            'phone' => $this->phone,
            'title' => $this->title,
            'hasSignature' => (bool) $this->has_signature,
            'signaturePath' => $this->signature_path,
        ];
    }
}
