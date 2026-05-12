<?php

namespace Tests\Feature\Phase4;

use App\Models\InvoiceType;
use App\Models\LegalDocument;
use Tests\TestCase;

class LegalDocumentCrudTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_admin_can_create_read_update_and_delete_legal_document(): void
    {
        $admin = $this->makeUser('admin', 'KV3');

        $id = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/legal-documents', [
                'code' => 'P4-LD-001',
                'name' => 'Phase 4 Legal Document',
                'description' => 'Catalog document',
                'group' => 'contract',
                'default_required' => false,
                'default_deadline_days' => 7,
                'enabled' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'P4-LD-001')
            ->assertJsonPath('data.group', 'contract')
            ->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/legal-documents?group=contract&enabled=1')
            ->assertOk()
            ->assertJsonFragment(['code' => 'P4-LD-001']);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/legal-documents/{$id}", ['name' => 'Updated Legal Document', 'enabled' => false])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Legal Document')
            ->assertJsonPath('data.enabled', false);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/legal-documents/{$id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('legal_documents', ['id' => $id]);
    }

    public function test_destroy_is_blocked_when_legal_document_is_used_by_invoice_type(): void
    {
        $admin = $this->makeUser('admin', 'KV3');
        $legalDocument = LegalDocument::firstOrFail();
        InvoiceType::firstOrFail()->legalDocuments()->attach($legalDocument->id, ['required' => true]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/legal-documents/{$legalDocument->id}")
            ->assertStatus(409);
    }

    public function test_non_admin_without_catalog_manage_cannot_create_legal_document(): void
    {
        $employee = $this->makeUser('employee', 'KV3');

        $this->actingAs($employee, 'sanctum')
            ->postJson('/api/v1/legal-documents', [
                'code' => 'P4-LD-403',
                'name' => 'Forbidden Legal Document',
                'group' => 'contract',
            ])
            ->assertForbidden();
    }
}
