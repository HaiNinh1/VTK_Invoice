<?php

namespace Tests\Feature\Notifications;

use App\Models\Contract;
use App\Models\Notification;
use App\Models\NotificationSetting;
use App\Models\Request as InvoiceRequest;
use App\Models\User;
use App\Services\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $employee;
    private User $accountant;
    private User $admin;
    private Contract $contract;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->employee = User::where('email', 'an.nv@viettel.vn')->first();
        $this->accountant = User::where('email', 'binh.tt@viettel.vn')->first();
        $this->admin = User::where('email', 'dung.pm@viettel.vn')->first();
        $this->contract = Contract::where('department', 'KV3')->first();
        // Wipe any seeded notifications so each test starts clean.
        Notification::query()->delete();
    }

    public function test_submit_creates_pendingApproval_for_accountant_and_admin(): void
    {
        $draft = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit")->assertOk();

        $forAcc = Notification::where('user_id', $this->accountant->id)
            ->where('kind', 'pendingApproval')->first();
        $forAdmin = Notification::where('user_id', $this->admin->id)
            ->where('kind', 'pendingApproval')->first();

        $this->assertNotNull($forAcc);
        $this->assertNotNull($forAdmin);
        $this->assertStringContainsString($draft->id, $forAcc->title);
        // Employee should NOT receive their own pendingApproval.
        $this->assertNull(Notification::where('user_id', $this->employee->id)
            ->where('kind', 'pendingApproval')->first());
    }

    public function test_settings_off_for_kind_blocks_creation(): void
    {
        // Disable pendingApproval for accountant.
        NotificationSetting::updateOrCreate(
            ['user_id' => $this->accountant->id, 'key' => 'pendingApproval'],
            ['enabled' => false],
        );
        $draft = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit")->assertOk();

        $this->assertNull(Notification::where('user_id', $this->accountant->id)
            ->where('kind', 'pendingApproval')->first());
        // Admin should still get it.
        $this->assertNotNull(Notification::where('user_id', $this->admin->id)
            ->where('kind', 'pendingApproval')->first());
    }

    public function test_approve_notifies_creator_with_approved_kind(): void
    {
        $draft = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit")->assertOk();
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/approve", ['accountingRefNo' => 'CT-1'])
            ->assertOk();

        $row = Notification::where('user_id', $this->employee->id)
            ->where('kind', 'approved')->first();
        $this->assertNotNull($row);
        $this->assertSame($draft->id, $row->data_json['requestId']);
    }

    public function test_reject_and_return_create_correct_kinds_with_reason_in_description(): void
    {
        $draft = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit")->assertOk();
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/reject", ['reason' => 'Thiếu BB'])
            ->assertOk();

        $rej = Notification::where('user_id', $this->employee->id)
            ->where('kind', 'rejected')->first();
        $this->assertNotNull($rej);
        $this->assertStringContainsString('Thiếu BB', $rej->description);

        // Return on a fresh draft.
        $draft2 = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft2->id}/submit")->assertOk();
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/requests/{$draft2->id}/return", ['reason' => 'Cần bổ sung quyết toán'])
            ->assertOk();

        $ret = Notification::where('user_id', $this->employee->id)
            ->where('kind', 'returned')->where('data_json->requestId', $draft2->id)->first();
        $this->assertNotNull($ret);
        $this->assertStringContainsString('Cần bổ sung quyết toán', $ret->description);
    }

    public function test_index_endpoint_filters_by_settings_and_returns_unreadCount(): void
    {
        $draft = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit")->assertOk();

        $res = $this->actingAs($this->accountant, 'sanctum')->getJson('/api/notifications');
        $res->assertOk();
        $this->assertGreaterThanOrEqual(1, $res->json('unreadCount'));
        $kinds = collect($res->json('data'))->pluck('kind')->all();
        $this->assertContains('pendingApproval', $kinds);
    }

    public function test_mark_read_and_read_all(): void
    {
        $draft = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft->id}/submit")->assertOk();

        $row = Notification::where('user_id', $this->accountant->id)->first();
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson("/api/notifications/{$row->id}/read")->assertOk();
        $this->assertNotNull($row->fresh()->read_at);

        // Create another to test read-all.
        $draft2 = $this->createDraft();
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$draft2->id}/submit")->assertOk();
        $this->actingAs($this->accountant, 'sanctum')
            ->postJson('/api/notifications/read-all')->assertOk();
        $this->assertSame(0, Notification::where('user_id', $this->accountant->id)
            ->whereNull('read_at')->count());
    }

    public function test_settings_endpoints_get_and_patch(): void
    {
        $get = $this->actingAs($this->employee, 'sanctum')->getJson('/api/notification-settings');
        $get->assertOk()
            ->assertJsonPath('data.pendingApproval', true)
            ->assertJsonPath('data.system', false);

        $patch = $this->actingAs($this->employee, 'sanctum')
            ->patchJson('/api/notification-settings', ['system' => true, 'rejected' => false]);
        $patch->assertOk()
            ->assertJsonPath('data.system', true)
            ->assertJsonPath('data.rejected', false);
    }

    public function test_deadline_command_emits_overdue_and_due_soon(): void
    {
        // Overdue — deadline 5 days ago.
        $overdue = $this->createDraft([
            'hasCommitment' => true,
            'commitmentText' => 'Quá hạn',
            'commitmentDeadline' => now()->subDays(5)->toDateString(),
        ]);
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$overdue->id}/submit")->assertOk();

        // Due soon — deadline +2 days.
        $soon = $this->createDraft([
            'hasCommitment' => true,
            'commitmentText' => 'Sắp đến',
            'commitmentDeadline' => now()->addDays(2)->toDateString(),
        ]);
        $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/requests/{$soon->id}/submit")->assertOk();

        $dispatcher = $this->app->make(NotificationDispatcher::class);
        $created = $dispatcher->dispatchDeadlineNotifications();
        $this->assertGreaterThanOrEqual(2, $created);

        $overdueNotif = Notification::where('user_id', $this->employee->id)
            ->where('kind', 'commitmentOverdue')
            ->where('data_json->requestId', $overdue->id)->first();
        $soonNotif = Notification::where('user_id', $this->employee->id)
            ->where('kind', 'legalDueSoon')
            ->where('data_json->requestId', $soon->id)->first();
        $this->assertNotNull($overdueNotif);
        $this->assertNotNull($soonNotif);

        // Idempotent: running twice on the same day creates 0 new rows.
        $second = $dispatcher->dispatchDeadlineNotifications();
        $this->assertSame(0, $second);
    }

    private function createDraft(array $overrides = []): InvoiceRequest
    {
        $payload = array_merge([
            'contractId' => $this->contract->id,
            'valueBeforeVAT' => 1_000_000,
            'vatRate' => 10,
            'paymentTerm' => 'Đợt 1',
            'paymentMethod' => 'Chuyển khoản',
            'invoiceType' => 'Tạo mới',
            'legalChecklist' => ['total' => 0, 'checked' => 0],
        ], $overrides);
        $res = $this->actingAs($this->employee, 'sanctum')->postJson('/api/requests', $payload);
        $res->assertCreated();
        return InvoiceRequest::find($res->json('data.id'));
    }
}
