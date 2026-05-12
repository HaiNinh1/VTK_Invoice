<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\RevenueCenter;
use Illuminate\Database\Seeder;

class DepartmentRevenueCenterSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['code' => 'D-KD', 'name' => 'Phòng Kinh doanh'],
            ['code' => 'D-KT', 'name' => 'Phòng Kế toán'],
            ['code' => 'D-KT-TC', 'name' => 'Phòng Kỹ thuật'],
            ['code' => 'D-VPGD', 'name' => 'Văn phòng giám đốc'],
            ['code' => 'D-HCNS', 'name' => 'Hành chính nhân sự'],
        ];
        foreach ($departments as $d) {
            Department::firstOrCreate(['code' => $d['code']], $d);
        }

        $centers = [
            ['code' => 'KV1', 'name' => 'Khu vực 1 - Hà Nội'],
            ['code' => 'KV2', 'name' => 'Khu vực 2 - Hải Phòng'],
            ['code' => 'KV3', 'name' => 'Khu vực 3 - Đà Nẵng'],
            ['code' => 'KV4', 'name' => 'Khu vực 4 - TP. HCM'],
            ['code' => 'KV5', 'name' => 'Khu vực 5 - Cần Thơ'],
        ];
        foreach ($centers as $c) {
            RevenueCenter::firstOrCreate(['code' => $c['code']], $c);
        }
    }
}
