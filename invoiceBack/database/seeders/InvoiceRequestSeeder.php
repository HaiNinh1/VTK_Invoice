<?php

namespace Database\Seeders;

use App\Enums\InvoiceStatus;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Models\User;
use App\Services\InvoiceCodeGenerator;
use App\Services\LegalComplianceService;
use Illuminate\Database\Seeder;

class InvoiceRequestSeeder extends Seeder
{
    public function run(InvoiceCodeGenerator $codes, LegalComplianceService $compliance): void
    {
        $employee = User::where('email', 'employee@vtk.local')->first();
        $employeeKv1 = User::where('email', 'employee.kv1@vtk.local')->first();
        if (! $employee || ! $employeeKv1) {
            return;
        }

        $itStd = InvoiceType::where('code', 'IT-STD')->first();
        $itInstall = InvoiceType::where('code', 'IT-INSTALL')->first();
        $svInstall = ServiceType::where('code', 'SV-INSTALL')->first();
        $svCloud = ServiceType::where('code', 'SV-CLOUD')->first();
        $customers = Customer::all();
        $kv3 = RevenueCenter::where('code', 'KV3')->first();
        $kv1 = RevenueCenter::where('code', 'KV1')->first();

        $rows = [
            // Two drafts owned by employee in KV3
            ['creator' => $employee, 'type' => $itStd, 'service' => $svCloud, 'center' => $kv3, 'amount' => '1500000000.00', 'status' => InvoiceStatus::Draft],
            ['creator' => $employee, 'type' => $itInstall, 'service' => $svInstall, 'center' => $kv3, 'amount' => '2450000000.00', 'status' => InvoiceStatus::Draft],
            // One pending in KV3
            ['creator' => $employee, 'type' => $itStd, 'service' => $svCloud, 'center' => $kv3, 'amount' => '850000000.00', 'status' => InvoiceStatus::Pending],
            // One owned by KV1 employee
            ['creator' => $employeeKv1, 'type' => $itStd, 'service' => $svCloud, 'center' => $kv1, 'amount' => '950000000.00', 'status' => InvoiceStatus::Draft],
        ];

        foreach ($rows as $i => $r) {
            $customer = $customers[$i % $customers->count()];
            $before = (float) $r['amount'];
            $tax = 10;
            $after = $before * 1.1;

            $invoice = InvoiceRequest::create([
                'request_code' => $codes->generate(),
                'invoice_type_id' => $r['type']?->id,
                'customer_id' => $customer->id,
                'service_type_id' => $r['service']?->id,
                'revenue_center_id' => $r['center']?->id,
                'creator_id' => $r['creator']->id,
                'department_id' => $r['creator']->department_id,
                'before_vat' => number_format($before, 2, '.', ''),
                'tax_rate' => $tax,
                'after_vat' => number_format($after, 2, '.', ''),
                'status' => $r['status']->value,
                'notes' => 'Seed invoice #'.($i + 1),
                'created_by' => $r['creator']->id,
            ]);
            $compliance->refresh($invoice);
        }
    }
}
