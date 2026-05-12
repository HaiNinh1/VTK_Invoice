<?php

namespace Tests\Feature\Phase2;

use App\Enums\InvoiceStatus;
use App\Models\Commitment;
use App\Models\Customer;
use App\Models\InvoiceRequest;
use App\Models\InvoiceType;
use App\Models\RevenueCenter;
use App\Models\ServiceType;
use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class CommitmentFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_create_commitment_submit_director_accepts_and_approves_invoice(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $director = $this->makeUser('director', null, 'D-VPGD');
        $invoice = $this->seedDraft($employee);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/commitments", [
                'content' => 'Cam kết bổ sung hồ sơ pháp lý còn thiếu trong thời hạn quy định.',
                'deadline' => now()->addDays(5)->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.director_decision', 'pending');

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending-vpgd');

        $commitment = Commitment::where('invoice_request_id', $invoice->id)->firstOrFail();

        $this->actingAs($director, 'sanctum')
            ->postJson("/api/v1/commitments/{$commitment->id}/decide", [
                'decision' => 'accepted',
                'note' => 'Cam kết được chấp thuận.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'fulfilled');

        $this->actingAs($director, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/approve", ['comment' => 'director ok'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertSame(InvoiceStatus::Approved, $invoice->refresh()->status);
    }

    public function test_director_rejects_commitment_returns_invoice_with_reason(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $director = $this->makeUser('director', null, 'D-VPGD');
        $invoice = $this->seedDraft($employee);
        $commitment = $this->createPendingCommitment($invoice, $employee);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/submit")
            ->assertOk();

        $this->actingAs($director, 'sanctum')
            ->postJson("/api/v1/commitments/{$commitment->id}/decide", [
                'decision' => 'rejected',
                'note' => 'Thiếu hồ sơ pháp lý quan trọng.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Returned, $invoice->status);
        $this->assertStringContainsString('Commitment rejected', (string) $invoice->return_reason);
    }

    public function test_extending_past_max_extensions_returns_422(): void
    {
        config(['commitments.max_extensions' => 1]);

        $employee = $this->makeUser('employee', 'KV3');
        $director = $this->makeUser('director', null, 'D-VPGD');
        $invoice = $this->seedDraft($employee);
        $commitment = $this->createPendingCommitment($invoice, $employee);

        $payload = ['days' => 2, 'reason' => 'Cần thêm thời gian để bổ sung hồ sơ.'];

        $this->actingAs($director, 'sanctum')
            ->postJson("/api/v1/commitments/{$commitment->id}/extend", $payload)
            ->assertOk();

        $this->actingAs($director, 'sanctum')
            ->postJson("/api/v1/commitments/{$commitment->id}/extend", $payload)
            ->assertStatus(422)
            ->assertJsonPath('message', 'max_extensions_exceeded');
    }

    public function test_non_director_cannot_decide(): void
    {
        $employee = $this->makeUser('employee', 'KV3');
        $invoice = $this->seedDraft($employee);
        $commitment = $this->createPendingCommitment($invoice, $employee);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/commitments/{$commitment->id}/decide", [
                'decision' => 'accepted',
            ])
            ->assertForbidden();
    }

    public function test_non_creator_cannot_create_commitment_for_someone_elses_invoice(): void
    {
        $creator = $this->makeUser('employee', 'KV3');
        $other = $this->makeUser('employee', 'KV3');
        $invoice = $this->seedDraft($creator);

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/v1/invoice-requests/{$invoice->id}/commitments", [
                'content' => 'Cam kết bổ sung hồ sơ pháp lý theo yêu cầu.',
                'deadline' => now()->addDays(5)->toDateString(),
            ])
            ->assertForbidden();
    }

    private function seedDraft($creator): InvoiceRequest
    {
        return InvoiceRequest::create([
            'request_code' => app(InvoiceCodeGenerator::class)->generate(),
            'invoice_type_id' => InvoiceType::first()->id,
            'customer_id' => Customer::first()->id,
            'service_type_id' => ServiceType::first()->id,
            'revenue_center_id' => RevenueCenter::where('code', 'KV3')->first()->id,
            'creator_id' => $creator->id,
            'department_id' => $creator->department_id,
            'before_vat' => 1000000,
            'tax_rate' => 10,
            'after_vat' => 1100000,
            'status' => 'draft',
        ]);
    }

    private function createPendingCommitment(InvoiceRequest $invoice, $employee): Commitment
    {
        return Commitment::create([
            'invoice_request_id' => $invoice->id,
            'code' => 'CK-'.uniqid(),
            'content' => 'Cam kết bổ sung hồ sơ pháp lý còn thiếu.',
            'status' => 'pending',
            'director_decision' => 'pending',
            'deadline' => now()->addDays(5)->toDateString(),
            'created_by' => $employee->id,
            'signer_id' => $employee->id,
            'signed_at' => now(),
        ]);
    }
}
