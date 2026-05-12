<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\RevenueCenter;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $kv3 = RevenueCenter::where('code', 'KV3')->first();
        $kv1 = RevenueCenter::where('code', 'KV1')->first();
        $kd = Department::where('code', 'D-KD')->first();
        $kt = Department::where('code', 'D-KT')->first();
        $vpgd = Department::where('code', 'D-VPGD')->first();

        $users = [
            [
                'name' => 'Nguyễn Nhân Viên', 'email' => 'employee@vtk.local',
                'role' => 'employee', 'employee_code' => 'NV001',
                'department_id' => $kd?->id, 'revenue_center_id' => $kv3?->id,
            ],
            [
                'name' => 'Trần Quản Lý', 'email' => 'manager@vtk.local',
                'role' => 'manager', 'employee_code' => 'NV010',
                'department_id' => $kd?->id, 'revenue_center_id' => $kv3?->id,
            ],
            [
                'name' => 'Lê Kế Toán', 'email' => 'accountant@vtk.local',
                'role' => 'accountant', 'employee_code' => 'NV020',
                'department_id' => $kt?->id, 'revenue_center_id' => null,
            ],
            [
                'name' => 'Phạm Giám Đốc', 'email' => 'director@vtk.local',
                'role' => 'director', 'employee_code' => 'NV030',
                'department_id' => $vpgd?->id, 'revenue_center_id' => null,
            ],
            [
                'name' => 'Hoàng Quản Trị', 'email' => 'admin@vtk.local',
                'role' => 'admin', 'employee_code' => 'NV099',
                'department_id' => $vpgd?->id, 'revenue_center_id' => null,
            ],
            // Extra employee in KV1 to test scoping
            [
                'name' => 'Nguyễn Văn KV1', 'email' => 'employee.kv1@vtk.local',
                'role' => 'employee', 'employee_code' => 'NV002',
                'department_id' => $kd?->id, 'revenue_center_id' => $kv1?->id,
            ],
            [
                'name' => 'Trần KV1 Manager', 'email' => 'manager.kv1@vtk.local',
                'role' => 'manager', 'employee_code' => 'NV011',
                'department_id' => $kd?->id, 'revenue_center_id' => $kv1?->id,
            ],
        ];

        foreach ($users as $u) {
            $role = $u['role'];
            unset($u['role']);
            $u['password'] = Hash::make('password');
            $u['is_active'] = true;
            $user = User::updateOrCreate(['email' => $u['email']], $u);
            $user->syncRoles([$role]);
        }
    }
}
