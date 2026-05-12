<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Customer;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class ContractSeeder extends Seeder
{
    public function run(): void
    {
        $customer = Customer::where('tax_code', '0100686209')->first() ?? Customer::first();

        if (! $customer) {
            return;
        }

        $contract = Contract::updateOrCreate(
            ['code' => 'HD-2026-0001'],
            [
                'customer_id' => $customer->id,
                'name' => 'Hợp đồng dịch vụ chuyển đổi số KV3',
                'total_amount' => '3300000000.00',
                'signed_date' => CarbonImmutable::create(2026, 1, 15),
                'expiry_date' => CarbonImmutable::create(2026, 12, 31),
                'status' => 'active',
                'notes' => 'Seed contract for P0+ installment invoice flow.',
            ]
        );

        foreach ([
            ['sequence' => 1, 'name' => 'Đợt 1 - Tạm ứng', 'amount' => '1100000000.00', 'due_date' => '2026-02-15'],
            ['sequence' => 2, 'name' => 'Đợt 2 - Nghiệm thu giai đoạn', 'amount' => '1100000000.00', 'due_date' => '2026-06-15'],
            ['sequence' => 3, 'name' => 'Đợt 3 - Quyết toán', 'amount' => '1100000000.00', 'due_date' => '2026-11-30'],
        ] as $installment) {
            $contract->installments()->updateOrCreate(
                ['sequence' => $installment['sequence']],
                $installment + [
                    'status' => 'pending',
                    'invoiced_amount' => '0.00',
                    'paid_amount' => '0.00',
                ]
            );
        }
    }
}
