<?php

namespace Tests\Feature\Phase3;

use App\Models\Contract;
use App\Models\Customer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContractDocumentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_admin_can_upload_list_and_delete_contract_document(): void
    {
        Storage::fake('local');
        $admin = $this->makeUser('admin', 'KV3');
        $contract = Contract::create([
            'code' => 'P3-DOC-CTR',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Document Contract',
            'total_amount' => 1000,
            'status' => 'active',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/documents", [
                'kind' => 'signed_contract',
                'file' => UploadedFile::fake()->create('contract.pdf', 1024, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.kind', 'signed_contract');

        $path = $response->json('data.file_path');
        $documentId = $response->json('data.id');
        Storage::disk('local')->assertExists($path);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/contracts/{$contract->id}/documents")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/contracts/{$contract->id}/documents/{$documentId}")
            ->assertNoContent();

        Storage::disk('local')->assertMissing($path);
    }

    public function test_document_upload_rejects_disallowed_mime_type(): void
    {
        Storage::fake('local');
        $admin = $this->makeUser('admin', 'KV3');
        $contract = Contract::create([
            'code' => 'P3-DOC-INVALID',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Invalid Document Contract',
            'total_amount' => 1000,
            'status' => 'active',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/documents", [
                'file' => UploadedFile::fake()->create('malware.exe', 1, 'application/octet-stream'),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);
    }

    public function test_non_admin_without_contract_manage_cannot_upload_document(): void
    {
        Storage::fake('local');
        $employee = $this->makeUser('employee', 'KV3');
        $contract = Contract::create([
            'code' => 'P3-DOC-403',
            'customer_id' => Customer::firstOrFail()->id,
            'name' => 'Forbidden Document Contract',
            'total_amount' => 1000,
            'status' => 'active',
        ]);

        $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/contracts/{$contract->id}/documents", [
                'file' => UploadedFile::fake()->create('contract.pdf', 1, 'application/pdf'),
            ])
            ->assertForbidden();
    }
}
