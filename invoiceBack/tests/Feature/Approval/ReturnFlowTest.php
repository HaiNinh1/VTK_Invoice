<?php

namespace Tests\Feature\Approval;

use App\Enums\InvoiceStatus;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class ReturnFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_accountant_can_return_owner_edits_and_resubmits(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');
        $invoice = $this->seedDraft($employee);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();

        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/return", [
                'reason' => 'Vui lòng bổ sung biên bản nghiệm thu.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'returned');

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Returned, $invoice->status);
        $this->assertSame('Vui lòng bổ sung biên bản nghiệm thu.', $invoice->return_reason);

        $this->actingAs($employee, 'sanctum')
            ->putJson("/api/v1/invoice-requests/{$invoice->id}", ['notes' => 'Đã bổ sung hồ sơ'])
            ->assertOk();

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/resubmit")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_return_reason_is_required(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $accountant = $this->makeUser('accountant', null, 'D-KT');
        $invoice = $this->seedDraft($employee);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();

        $this->actingAs($accountant, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/return", [])
            ->assertStatus(422);
    }

    private function seedDraft($creator): InvoiceRequest
    {
        $rc = RevenueCenter::where('code', 'KV3')->first();

        $invoice = InvoiceRequest::create([
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
            'status' => 'draft',
        ]);

        return $this->satisfyLegalRequirements($invoice);
    }
}
