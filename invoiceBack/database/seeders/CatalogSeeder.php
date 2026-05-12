<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\InvoiceType;
use App\Models\LegalDocument;
use App\Models\ServiceType;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['code' => 'SV-INSTALL', 'name' => 'Lắp đặt'],
            ['code' => 'SV-MEASURE', 'name' => 'Đo lường'],
            ['code' => 'SV-CONSULT', 'name' => 'Tư vấn'],
            ['code' => 'SV-DEV', 'name' => 'Phát triển'],
            ['code' => 'SV-MAINT', 'name' => 'Bảo trì'],
            ['code' => 'SV-INTEG', 'name' => 'Tích hợp'],
            ['code' => 'SV-CLOUD', 'name' => 'Cloud'],
            ['code' => 'SV-TRAIN', 'name' => 'Đào tạo'],
        ];
        foreach ($services as $s) {
            ServiceType::firstOrCreate(['code' => $s['code']], $s);
        }

        for ($i = 1; $i <= 11; $i++) {
            $code = sprintf('LD-%02d', $i);
            LegalDocument::firstOrCreate(['code' => $code], [
                'code' => $code,
                'name' => "Tài liệu pháp lý {$code}",
                'description' => "Hồ sơ pháp lý loại {$i}",
                'default_required' => true,
            ]);
        }

        $invoiceTypes = [
            ['code' => 'IT-STD', 'name' => 'Hóa đơn dịch vụ tiêu chuẩn'],
            ['code' => 'IT-INSTALL', 'name' => 'Hóa đơn lắp đặt'],
            ['code' => 'IT-MAINT', 'name' => 'Hóa đơn bảo trì'],
            ['code' => 'IT-CLOUD', 'name' => 'Hóa đơn dịch vụ Cloud'],
            ['code' => 'IT-CONSULT', 'name' => 'Hóa đơn tư vấn'],
            ['code' => 'IT-INTEG', 'name' => 'Hóa đơn tích hợp'],
            ['code' => 'IT-TRAIN', 'name' => 'Hóa đơn đào tạo'],
            ['code' => 'IT-DEV', 'name' => 'Hóa đơn phát triển'],
        ];
        foreach ($invoiceTypes as $t) {
            InvoiceType::firstOrCreate(['code' => $t['code']], $t + ['status' => 'active']);
        }

        $customers = [
            ['name' => 'VNPT Hà Nội', 'tax_code' => '0100686209'],
            ['name' => 'FPT Telecom', 'tax_code' => '0101778163'],
            ['name' => 'Viettel TP.HCM', 'tax_code' => '0100109106'],
            ['name' => 'CMC Corporation', 'tax_code' => '0101286604'],
            ['name' => 'Bưu điện Đà Nẵng', 'tax_code' => '0400101106'],
        ];
        foreach ($customers as $c) {
            Customer::firstOrCreate(['tax_code' => $c['tax_code']], $c);
        }
    }
}
