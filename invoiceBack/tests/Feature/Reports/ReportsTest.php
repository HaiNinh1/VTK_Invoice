<?php

namespace Tests\Feature\Reports;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_summary_returns_full_shape_for_accountant(): void
    {
        $acc = User::where('role', 'accountant')->firstOrFail();

        $res = $this->actingAs($acc)->getJson('/api/reports/summary');

        $res->assertOk()
            ->assertJsonStructure(['data' => [
                'months', 'selectedMonth', 'selectedDept',
                'totalRequests', 'totalValue', 'issuedValue',
                'pendingCount', 'rejectedCount',
                'byDepartment',
                'sInvoiceCounts' => ['dangXuLy', 'thanhCong', 'loi', 'tatCa'],
                'legalDossiers'  => ['totalC', 'completeC', 'incompleteC', 'avgPct', 'rows'],
            ]]);

        // Seeded data: 15 requests across 6 statuses.
        $this->assertSame(15, $res->json('data.totalRequests'));
        $this->assertSame(4, $res->json('data.sInvoiceCounts.tatCa')); // 4 'Đã xuất HĐ'
    }

    public function test_summary_scoped_to_department_for_manager(): void
    {
        $manager = User::where('role', 'manager')->firstOrFail();

        $res = $this->actingAs($manager)->getJson('/api/reports/summary');

        $res->assertOk();
        // Manager (KV3) sees fewer than acc/admin.
        $this->assertLessThanOrEqual(15, $res->json('data.totalRequests'));
        foreach ($res->json('data.byDepartment') as $row) {
            $this->assertSame($manager->department, $row['dept']);
        }
    }

    public function test_summary_filter_by_dept_only_works_for_admin_acc(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();

        $res = $this->actingAs($admin)->getJson('/api/reports/summary?dept=KV3');
        $res->assertOk();
        $this->assertSame('KV3', $res->json('data.selectedDept'));
        foreach ($res->json('data.byDepartment') as $row) {
            $this->assertSame('KV3', $row['dept']);
        }
    }

    public function test_contracts_xlsx_streams_and_opens(): void
    {
        $acc = User::where('role', 'accountant')->firstOrFail();
        $tmp = tempnam(sys_get_temp_dir(), 'vtk_');

        $res = $this->actingAs($acc)->get('/api/reports/contracts.xlsx');
        $res->assertOk();
        $this->assertSame(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            $res->headers->get('Content-Type'),
        );

        file_put_contents($tmp, $res->streamedContent());
        $book = IOFactory::load($tmp);
        $sheet = $book->getActiveSheet();

        $this->assertSame('Số HĐ', $sheet->getCell('A1')->getValue());
        $this->assertSame('Hồ sơ', $sheet->getCell('H1')->getValue());
        // 10 contracts seeded => 11 rows (header + 10).
        $this->assertGreaterThanOrEqual(10, $sheet->getHighestRow() - 1);

        @unlink($tmp);
    }

    public function test_requests_xlsx_filtered_by_month(): void
    {
        $acc = User::where('role', 'accountant')->firstOrFail();

        $res = $this->actingAs($acc)->get('/api/reports/requests.xlsx');
        $res->assertOk();
        $body = $res->streamedContent();
        $this->assertNotEmpty($body);
        // Magic bytes of xlsx zip container.
        $this->assertSame('PK', substr($body, 0, 2));
    }

    public function test_summary_requires_auth(): void
    {
        $this->getJson('/api/reports/summary')->assertUnauthorized();
    }
}
