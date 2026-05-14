<?php

namespace Tests\Feature\Users;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserCrudTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, string $email): User
    {
        return User::create([
            'name' => ucfirst($role),
            'email' => $email,
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

    public function test_admin_can_list_users(): void
    {
        $admin = $this->user('admin', 'a@v.vn');
        $this->user('employee', 'e@v.vn');

        $this->withHeader('Authorization', 'Bearer ' . $this->token($admin))
            ->getJson('/api/users')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_non_admin_cannot_list_users(): void
    {
        $emp = $this->user('employee', 'e@v.vn');

        $this->withHeader('Authorization', 'Bearer ' . $this->token($emp))
            ->getJson('/api/users')
            ->assertStatus(403);
    }

    public function test_admin_can_create_user(): void
    {
        $admin = $this->user('admin', 'a@v.vn');

        $this->withHeader('Authorization', 'Bearer ' . $this->token($admin))
            ->postJson('/api/users', [
                'name' => 'New Person',
                'email' => 'new@v.vn',
                'password' => 'password123',
                'role' => 'accountant',
                'department' => 'TC',
            ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'new@v.vn')
            ->assertJsonPath('data.role', 'accountant');

        $this->assertDatabaseHas('users', ['email' => 'new@v.vn', 'role' => 'accountant']);
    }

    public function test_create_validates_role_and_department(): void
    {
        $admin = $this->user('admin', 'a@v.vn');

        $this->withHeader('Authorization', 'Bearer ' . $this->token($admin))
            ->postJson('/api/users', [
                'name' => 'X',
                'email' => 'x@v.vn',
                'password' => 'password123',
                'role' => 'ceo',         // invalid
                'department' => 'KV99',  // invalid
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role', 'department']);
    }

    public function test_non_admin_cannot_create_user(): void
    {
        $emp = $this->user('accountant', 'a@v.vn');

        $this->withHeader('Authorization', 'Bearer ' . $this->token($emp))
            ->postJson('/api/users', [
                'name' => 'X',
                'email' => 'x@v.vn',
                'password' => 'password123',
                'role' => 'employee',
                'department' => 'KV1',
            ])
            ->assertStatus(403);
    }

    public function test_admin_can_update_user(): void
    {
        $admin = $this->user('admin', 'a@v.vn');
        $target = $this->user('employee', 'e@v.vn');

        $this->withHeader('Authorization', 'Bearer ' . $this->token($admin))
            ->patchJson('/api/users/u' . $target->id, [
                'department' => 'KV3',
            ])
            ->assertOk()
            ->assertJsonPath('data.department', 'KV3');
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = $this->user('admin', 'a@v.vn');
        $target = $this->user('employee', 'e@v.vn');

        $this->withHeader('Authorization', 'Bearer ' . $this->token($admin))
            ->deleteJson('/api/users/u' . $target->id)
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    public function test_admin_cannot_delete_self(): void
    {
        $admin = $this->user('admin', 'a@v.vn');

        $this->withHeader('Authorization', 'Bearer ' . $this->token($admin))
            ->deleteJson('/api/users/u' . $admin->id)
            ->assertStatus(422)
            ->assertJsonPath('reason', 'Không thể xoá chính bạn');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_route_binding_accepts_both_u_prefix_and_numeric(): void
    {
        $admin = $this->user('admin', 'a@v.vn');
        $target = $this->user('employee', 'e@v.vn');

        // u-prefixed
        $this->withHeader('Authorization', 'Bearer ' . $this->token($admin))
            ->getJson('/api/users/u' . $target->id)
            ->assertOk();

        // numeric
        $this->withHeader('Authorization', 'Bearer ' . $this->token($admin))
            ->getJson('/api/users/' . $target->id)
            ->assertOk();
    }
}
