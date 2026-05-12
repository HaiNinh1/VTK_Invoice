<?php

namespace Tests;

use App\Models\Department;
use App\Models\InvoiceRequest;
use App\Models\RevenueCenter;
use App\Models\User;
use App\Models\UserSignature;
use App\Services\LegalComplianceService;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DepartmentRevenueCenterSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\SignatureSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUpFixtures(): void
    {
        $this->seed([
            RolePermissionSeeder::class,
            DepartmentRevenueCenterSeeder::class,
            CatalogSeeder::class,
            SignatureSeeder::class,
        ]);
    }

    protected function makeUser(string $role, ?string $rcCode = null, ?string $deptCode = 'D-KD'): User
    {
        static $i = 0;
        $i++;
        $rc = $rcCode ? RevenueCenter::where('code', $rcCode)->first() : null;
        $dept = $deptCode ? Department::where('code', $deptCode)->first() : null;
        $user = User::create([
            'name' => ucfirst($role).' '.$i,
            'email' => $role.$i.'@test.local',
            'password' => 'password',
            'is_active' => true,
            'department_id' => $dept?->id,
            'revenue_center_id' => $rc?->id,
        ]);
        $user->assignRole($role);
        UserSignature::create([
            'user_id' => $user->id,
            'method' => 'text',
            'data_path' => "signatures/{$user->id}.txt",
            'font_family' => 'sans',
        ]);

        return $user;
    }

    /**
     * Upload placeholder legal documents covering every code the invoice
     * type requires, then refresh compliance. Used by tests that need
     * `legal_complete=true` without going through the HTTP upload flow.
     */
    protected function satisfyLegalRequirements(InvoiceRequest $invoice): InvoiceRequest
    {
        $type = $invoice->invoiceType()->first();
        $codes = (array) ($type?->required_legal_documents ?? []);

        foreach ($codes as $code) {
            $invoice->legalDocuments()->create([
                'document_type' => $code,
                'file_path' => "fake/{$code}.pdf",
                'original_filename' => "{$code}.pdf",
                'file_size' => 100,
                'mime_type' => 'application/pdf',
                'uploaded_by_id' => $invoice->creator_id,
                'created_at' => now(),
            ]);
        }

        app(LegalComplianceService::class)->refresh($invoice);

        return $invoice->refresh();
    }
}
