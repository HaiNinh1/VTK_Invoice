<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(array $attrs = []): User
    {
        return User::create(array_merge([
            'name' => 'Test User',
            'email' => 'test@viettel.vn',
            'password' => 'password123',
            'role' => 'employee',
            'department' => 'KV1',
            'has_signature' => false,
        ], $attrs));
    }

    public function test_login_succeeds_with_valid_credentials(): void
    {
        $user = $this->makeUser(['email' => 'an.nv@viettel.vn']);

        $res = $this->postJson('/api/auth/login', [
            'email' => 'an.nv@viettel.vn',
            'password' => 'password123',
        ]);

        $res->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role', 'roleLabel', 'department', 'hasSignature']])
            ->assertJsonPath('user.id', 'u' . $user->id)
            ->assertJsonPath('user.email', 'an.nv@viettel.vn')
            ->assertJsonPath('user.roleLabel', 'Nhân viên');
    }

    public function test_login_works_for_all_seed_roles(): void
    {
        $users = [
            ['email' => 'an.nv@viettel.vn',   'role' => 'employee',   'label' => 'Nhân viên'],
            ['email' => 'binh.tt@viettel.vn', 'role' => 'accountant', 'label' => 'Kế toán'],
            ['email' => 'cuong.lq@viettel.vn', 'role' => 'manager',   'label' => 'Quản lý'],
            ['email' => 'dung.pm@viettel.vn', 'role' => 'admin',      'label' => 'Quản trị viên'],
            ['email' => 'duc.hm@viettel.vn',  'role' => 'employee',   'label' => 'Nhân viên'],
        ];

        foreach ($users as $u) {
            $this->makeUser(['email' => $u['email'], 'role' => $u['role']]);
            $this->postJson('/api/auth/login', ['email' => $u['email'], 'password' => 'password123'])
                ->assertOk()
                ->assertJsonPath('user.role', $u['role'])
                ->assertJsonPath('user.roleLabel', $u['label']);
        }
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->makeUser();

        $this->postJson('/api/auth/login', [
            'email' => 'test@viettel.vn',
            'password' => 'wrongpassword',
        ])->assertStatus(422);
    }

    public function test_login_fails_for_unknown_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'ghost@viettel.vn',
            'password' => 'password123',
        ])->assertStatus(422);
    }

    public function test_me_returns_user_for_authenticated_request(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', 'u' . $user->id);
    }

    public function test_me_requires_auth(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = $this->makeUser();
        $plain = $user->createToken('test')->plainTextToken;
        $tokenId = (int) explode('|', $plain)[0];

        $this->withHeader('Authorization', 'Bearer ' . $plain)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('ok', true);

        // Deterministic: token row removed from DB.
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }
}
