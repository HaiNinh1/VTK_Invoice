<?php

namespace Tests\Feature\Signature;

use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Models\SignatureSnapshot;
use App\Models\UserSignature;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class SignatureGateTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_approve_requires_signature_and_creates_snapshot(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');
        UserSignature::where('user_id', $accountant->id)->delete();
        $invoice = $this->seedPending($employee);

        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertStatus(428)
            ->assertJsonPath('error', 'signature_required');

        $this->actingAs($accountant, 'sanctum')
            ->postJson('/api/v1/me/signature', [
                'method' => 'text',
                'text' => 'Kế toán',
            ])
            ->assertOk();

        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve")
            ->assertOk();

        $this->assertSame(1, SignatureSnapshot::where('user_id', $accountant->id)->count());
    }

    private function seedPending($creator): InvoiceRequest
    {
        $rc = RevenueCenter::where('code', 'KV3')->first();

        return InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => Customer::first()->id,
            'service_type_id' => ServiceType::first()->id,
            'revenue_center_id' => $rc->id,
            'creator_id' => $creator->id,
            'department_id' => $creator->department_id,
            'before_vat' => 1000000,
            'tax_rate' => 10,
            'after_vat' => 1100000,
            'legal_complete' => true,
            'status' => 'pending',
        ]);
    }
}
