<?php

namespace Tests\Feature\Signature;

use App\Models\UserSignature;
use Tests\TestCase;

class SignatureSetupTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_user_can_create_get_and_delete_text_signature(): void
    {
        $user = $this->makeUser('employee', 'KV3');
        UserSignature::where('user_id', $user->id)->delete();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/me/signature')
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/me/signature', [
                'method' => 'text',
                'text' => 'Nguyễn Nhân Viên',
                'font_family' => 'serif',
            ])
            ->assertOk()
            ->assertJsonPath('data.method', 'text');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/me/signature')
            ->assertOk()
            ->assertJsonPath('data.font_family', 'serif');

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/v1/me/signature')
            ->assertNoContent();
    }
}
