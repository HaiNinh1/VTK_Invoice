<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function authed(): array
    {
        $user = User::create([
            'name' => 'Old Name',
            'email' => 'old@viettel.vn',
            'password' => 'password123',
            'role' => 'employee',
            'department' => 'KV1',
            'has_signature' => false,
        ]);

        return [$user, $user->createToken('test')->plainTextToken];
    }

    public function test_profile_update_changes_name_and_email(): void
    {
        [$user, $token] = $this->authed();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/profile', [
                'name' => 'New Name',
                'email' => 'new@viettel.vn',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.email', 'new@viettel.vn');

        $this->assertSame('new@viettel.vn', $user->fresh()->email);
    }

    public function test_profile_update_rejects_duplicate_email(): void
    {
        [, $token] = $this->authed();
        User::create([
            'name' => 'Other',
            'email' => 'taken@viettel.vn',
            'password' => 'password123',
            'role' => 'employee',
            'department' => 'KV2',
            'has_signature' => false,
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/profile', [
                'name' => 'X',
                'email' => 'taken@viettel.vn',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_signature_upload_sets_has_signature_true(): void
    {
        Storage::fake('public');
        [$user, $token] = $this->authed();

        $file = UploadedFile::fake()->create('sig.png', 50, 'image/png');

        $res = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->post('/api/profile/signature', ['signature' => $file], ['Accept' => 'application/json']);

        $res->assertOk()->assertJsonPath('ok', true);

        $user->refresh();
        $this->assertTrue($user->has_signature);
        $this->assertNotNull($user->signature_path);
        Storage::disk('public')->assertExists($user->signature_path);
    }

    public function test_signature_upload_rejects_pdf(): void
    {
        Storage::fake('public');
        [, $token] = $this->authed();

        $file = UploadedFile::fake()->create('bad.pdf', 100, 'application/pdf');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->post('/api/profile/signature', ['signature' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['signature']);
    }
}
