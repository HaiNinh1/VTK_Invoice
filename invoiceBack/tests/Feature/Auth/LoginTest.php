<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class LoginTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpFixtures();
    }

    public function test_login_returns_token_for_valid_credentials(): void
    {
        $user = $this->makeUser('employee', 'KV3');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'roles', 'permissions']]);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_login_rejects_invalid_password(): void
    {
        $user = $this->makeUser('employee', 'KV3');

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_login_rejects_inactive_user(): void
    {
        $user = $this->makeUser('employee', 'KV3');
        $user->update(['is_active' => false]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(422);
    }

    public function test_me_requires_auth(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }

    public function test_me_returns_current_user(): void
    {
        $user = $this->makeUser('manager', 'KV3');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.roles.0', 'manager');
    }

    public function test_logout_revokes_token(): void
    {
        $user = $this->makeUser('employee', 'KV3');
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/auth/logout')
            ->assertNoContent();
    }
}
