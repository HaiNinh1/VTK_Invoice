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
            ['code' => 'IT-STD', 'name' => 'Hóa đơn dịch vụ tiêu chuẩn', 'required_legal_documents' => ['contract', 'acceptance']],
            ['code' => 'IT-INSTALL', 'name' => 'Hóa đơn lắp đặt', 'required_legal_documents' => ['contract', 'handover', 'acceptance']],
            ['code' => 'IT-MAINT', 'name' => 'Hóa đơn bảo trì', 'required_legal_documents' => ['contract', 'maintenance_report']],
            ['code' => 'IT-CLOUD', 'name' => 'Hóa đơn dịch vụ Cloud', 'required_legal_documents' => ['contract', 'service_report']],
            ['code' => 'IT-CONSULT', 'name' => 'Hóa đơn tư vấn', 'required_legal_documents' => ['contract', 'acceptance']],
            ['code' => 'IT-INTEG', 'name' => 'Hóa đơn tích hợp', 'required_legal_documents' => ['contract', 'handover', 'acceptance']],
            ['code' => 'IT-TRAIN', 'name' => 'Hóa đơn đào tạo', 'required_legal_documents' => ['contract', 'training_minutes']],
            ['code' => 'IT-DEV', 'name' => 'Hóa đơn phát triển', 'required_legal_documents' => ['contract', 'acceptance']],
        ];
        foreach ($invoiceTypes as $t) {
            InvoiceType::firstOrCreate(['code' => $t['code']], $t + ['status' => 'active']);
        }

        $customers = [
            ['name' => 'VNPT Hà Nội', 'tax_code' => '0100686209', 'address' => '75 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội', 'buyer_name' => 'Nguyễn Thị Hà', 'buyer_email' => 'buyer.vnpt@example.test', 'buyer_phone' => '0901000001'],
            ['name' => 'FPT Telecom', 'tax_code' => '0101778163', 'address' => '48 Vạn Bảo, Ba Đình, Hà Nội', 'buyer_name' => 'Trần Văn Phúc', 'buyer_email' => 'buyer.fpt@example.test', 'buyer_phone' => '0901000002'],
            ['name' => 'Viettel TP.HCM', 'tax_code' => '0100109106', 'address' => '285 Cách Mạng Tháng Tám, Quận 10, TP.HCM', 'buyer_name' => 'Lê Minh Anh', 'buyer_email' => 'buyer.viettel@example.test', 'buyer_phone' => '0901000003'],
            ['name' => 'CMC Corporation', 'tax_code' => '0101286604', 'address' => '11 Duy Tân, Cầu Giấy, Hà Nội', 'buyer_name' => 'Phạm Hoài Nam', 'buyer_email' => 'buyer.cmc@example.test', 'buyer_phone' => '0901000004'],
            ['name' => 'Bưu điện Đà Nẵng', 'tax_code' => '0400101106', 'address' => '271 Nguyễn Văn Linh, Đà Nẵng', 'buyer_name' => 'Võ Thanh Tâm', 'buyer_email' => 'buyer.danang@example.test', 'buyer_phone' => '0901000005'],
        ];
        foreach ($customers as $c) {
            Customer::updateOrCreate(['tax_code' => $c['tax_code']], $c);
        }
    }
}
