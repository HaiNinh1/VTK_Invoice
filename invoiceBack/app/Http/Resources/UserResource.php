<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'employee_code' => $this->employee_code,
            'department_id' => $this->department_id,
            'revenue_center_id' => $this->revenue_center_id,
            'department' => $this->whenLoaded('department', fn () => $this->department ? [
                'id' => $this->department->id,
                'code' => $this->department->code,
                'name' => $this->department->name,
            ] : null),
            'revenue_center' => $this->whenLoaded('revenueCenter', fn () => $this->revenueCenter ? [
                'id' => $this->revenueCenter->id,
                'code' => $this->revenueCenter->code,
                'name' => $this->revenueCenter->name,
            ] : null),
            'is_active' => (bool) $this->is_active,
            'roles' => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions()->pluck('name'),
        ];
    }
}
