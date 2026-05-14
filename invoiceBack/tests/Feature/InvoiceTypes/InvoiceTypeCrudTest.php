<?php

namespace Tests\Feature\InvoiceTypes;

use App\Models\DocumentGroup;
use App\Models\DocumentTemplate;
use App\Models\InvoiceType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceTypeCrudTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::create([
            'name' => ucfirst($role),
            'email' => $role.'@v.vn',
            'password' => 'password123',
            'role' => $role,
            'department' => $role === 'admin' ? 'IT' : 'KV1',
            'has_signature' => false,
        ]);
    }

    private function token(User $u): string
    {
        return $u->createToken('t')->plainTextToken;
    }

    public function test_anyone_authenticated_can_list_types(): void
    {
        $u = $this->user('employee');
        InvoiceType::create(['id' => 'tu-van', 'name' => 'Tư vấn', 'service_type' => 'Tư vấn', 'active' => true]);

        $this->withHeader('Authorization', 'Bearer '.$this->token($u))
            ->getJson('/api/invoice-types')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_creates_type_with_default_group(): void
    {
        $admin = $this->user('admin');
        $resp = $this->withHeader('Authorization', 'Bearer '.$this->token($admin))
            ->postJson('/api/invoice-types', ['name' => 'Bảo trì', 'serviceType' => 'Bảo trì'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Bảo trì')
            ->assertJsonPath('data.serviceType', 'Bảo trì');
        $this->assertSame('bao-tri', $resp->json('data.id'));
        $this->assertCount(1, $resp->json('data.documentGroups'));
        $this->assertSame('Hồ sơ Hợp đồng', $resp->json('data.documentGroups.0.groupName'));
    }

    public function test_non_admin_cannot_create_type(): void
    {
        $emp = $this->user('accountant'); // even accountant blocked (admin-only per FE tab)
        $this->withHeader('Authorization', 'Bearer '.$this->token($emp))
            ->postJson('/api/invoice-types', ['name' => 'X', 'serviceType' => 'X'])
            ->assertForbidden();
    }

    public function test_admin_can_toggle_active(): void
    {
        $admin = $this->user('admin');
        InvoiceType::create(['id' => 'x', 'name' => 'X', 'service_type' => 'X', 'active' => true]);
        $this->withHeader('Authorization', 'Bearer '.$this->token($admin))
            ->postJson('/api/invoice-types/x/toggle-active')
            ->assertOk()
            ->assertJson(['ok' => true, 'active' => false]);
    }

    public function test_admin_group_and_template_crud(): void
    {
        $admin = $this->user('admin');
        $token = $this->token($admin);
        $type = InvoiceType::create(['id' => 'x', 'name' => 'X', 'service_type' => 'X', 'active' => true]);

        // Add group.
        $g = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/invoice-types/x/groups', ['groupName' => 'Hồ sơ Nghiệm thu'])
            ->assertCreated()
            ->json('data.id');
        $this->assertIsInt($g);

        // Add template under group.
        $t = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/invoice-types/x/groups/{$g}/templates", ['name' => 'BB nghiệm thu', 'required' => true])
            ->assertCreated()
            ->json('data._id');
        $this->assertIsInt($t);

        // Toggle required.
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/document-templates/{$t}", ['required' => false])
            ->assertOk();
        $this->assertFalse((bool) DocumentTemplate::find($t)->required);

        // Delete template.
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/document-templates/{$t}")
            ->assertOk();
        $this->assertNull(DocumentTemplate::find($t));

        // Delete group.
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/invoice-types/x/groups/{$g}")
            ->assertOk();
        $this->assertNull(DocumentGroup::find($g));
    }

    public function test_delete_type_cascades_groups_and_templates(): void
    {
        $admin = $this->user('admin');
        $type = InvoiceType::create(['id' => 'x', 'name' => 'X', 'service_type' => 'X', 'active' => true]);
        $g = $type->documentGroups()->create(['name' => 'G', 'sort_order' => 1]);
        $g->templates()->create(['name' => 'T', 'required' => true, 'sort_order' => 1]);

        $this->withHeader('Authorization', 'Bearer '.$this->token($admin))
            ->deleteJson('/api/invoice-types/x')
            ->assertOk();

        $this->assertNull(InvoiceType::find('x'));
        $this->assertSame(0, DocumentGroup::where('invoice_type_id', 'x')->count());
    }
}
