<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private function authedUser(): array
    {
        $user = User::create([
            'name' => 'Test',
            'email' => 't@viettel.vn',
            'password' => 'password123',
            'role' => 'employee',
            'department' => 'KV1',
            'has_signature' => false,
        ]);

        return [$user, $user->createToken('test')->plainTextToken];
    }

    public function test_change_password_succeeds(): void
    {
        [$user, $token] = $this->authedUser();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/change-password', [
                'currentPwd' => 'password123',
                'newPwd' => 'newpassword456',
                'confirmPwd' => 'newpassword456',
            ])
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertTrue(Hash::check('newpassword456', $user->fresh()->password));
    }

    public function test_change_password_fails_when_current_wrong(): void
    {
        [, $token] = $this->authedUser();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/change-password', [
                'currentPwd' => 'wrongcurrent',
                'newPwd' => 'newpassword456',
                'confirmPwd' => 'newpassword456',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['currentPwd']);
    }

    public function test_change_password_fails_when_too_short(): void
    {
        [, $token] = $this->authedUser();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/change-password', [
                'currentPwd' => 'password123',
                'newPwd' => 'short',
                'confirmPwd' => 'short',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['newPwd']);
    }

    public function test_change_password_fails_when_mismatch(): void
    {
        [, $token] = $this->authedUser();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/change-password', [
                'currentPwd' => 'password123',
                'newPwd' => 'newpassword456',
                'confirmPwd' => 'differentpwd789',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['confirmPwd']);
    }
}
