<?php

namespace Database\Seeders;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\DocumentGroup;
use App\Models\DocumentTemplate;
use App\Models\InvoiceType;
use App\Models\NotificationSetting;
use App\Models\Rejection;
use App\Models\Request;
use App\Models\RequestDocument;
use App\Models\SInvoice;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds DB to match FE masterData.js exactly. FE is source of truth.
 *
 * Counts: 5 users, 4 invoice types, 10 contracts, 15 requests
 * (≥2 Nháp, ≥3 Chờ duyệt, ≥4 Đã duyệt, ≥4 Đã xuất HĐ, ≥1 Từ chối, ≥1 Trả lại bổ sung).
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        DB::transaction(function () {
            $users = $this->seedUsers();
            $this->seedNotificationSettings($users);
            $this->seedInvoiceTypes();
            $contracts = $this->seedContracts($users);
            $this->seedRequests($users, $contracts);
        });
    }

    /** @return array<string, User> keyed by 'u1'..'u5' */
    private function seedUsers(): array
    {
        $rows = [
            ['name' => 'Nguyễn Văn An',  'email' => 'an.nv@viettel.vn',   'role' => 'employee',   'department' => 'KV3', 'has_signature' => true],
            ['name' => 'Trần Thị Bình',  'email' => 'binh.tt@viettel.vn', 'role' => 'accountant', 'department' => 'TC',  'has_signature' => true],
            ['name' => 'Lê Quang Cường', 'email' => 'cuong.lq@viettel.vn','role' => 'manager',    'department' => 'KV3', 'has_signature' => false],
            ['name' => 'Phạm Mỹ Dung',   'email' => 'dung.pm@viettel.vn', 'role' => 'admin',      'department' => 'IT',  'has_signature' => true],
            ['name' => 'Hoàng Minh Đức', 'email' => 'duc.hm@viettel.vn',  'role' => 'employee',   'department' => 'KV1', 'has_signature' => true],
        ];

        $out = [];
        foreach ($rows as $i => $r) {
            $u = User::create([
                ...$r,
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]);
            $out['u' . ($i + 1)] = $u;
        }
        return $out;
    }

    /** @param array<string, User> $users */
    private function seedNotificationSettings(array $users): void
    {
        foreach ($users as $u) {
            foreach (NotificationSetting::DEFAULTS as $key => $enabled) {
                NotificationSetting::create([
                    'user_id' => $u->id, 'key' => $key, 'enabled' => $enabled,
                ]);
            }
        }
    }

    private function seedInvoiceTypes(): void
    {
        $config = [
            [
                'id' => 'lap-dat', 'name' => 'Lắp đặt công trình', 'service_type' => 'Lắp đặt',
                'groups' => [
                    ['name' => 'Hồ sơ Hợp đồng', 'docs' => [
                        ['code' => 'hd1', 'name' => 'Hợp đồng đã ký', 'required' => true],
                        ['code' => 'hd2', 'name' => 'Phụ lục hợp đồng', 'required' => false],
                        ['code' => 'hd3', 'name' => 'Biên bản đàm phán giá', 'required' => true],
                    ]],
                    ['name' => 'Hồ sơ Nghiệm thu', 'docs' => [
                        ['code' => 'nt1', 'name' => 'BB nghiệm thu khối lượng', 'required' => true],
                        ['code' => 'nt2', 'name' => 'BB nghiệm thu hoàn thành', 'required' => true],
                        ['code' => 'nt3', 'name' => 'Bảng tổng hợp KL nghiệm thu', 'required' => true],
                    ]],
                    ['name' => 'Hồ sơ Quyết toán', 'docs' => [
                        ['code' => 'qt1', 'name' => 'Biên bản quyết toán', 'required' => true],
                        ['code' => 'qt2', 'name' => 'Bảng tính giá trị quyết toán', 'required' => true],
                        ['code' => 'qt3', 'name' => 'Xác nhận công nợ', 'required' => true],
                    ]],
                    ['name' => 'Thanh toán & Bảo lãnh', 'docs' => [
                        ['code' => 'tt1', 'name' => 'Đề nghị thanh toán', 'required' => true],
                        ['code' => 'tt2', 'name' => 'BL thực hiện HĐ / Bảo hành', 'required' => true],
                    ]],
                ],
            ],
            [
                'id' => 'tu-van', 'name' => 'Tư vấn thiết kế', 'service_type' => 'Tư vấn',
                'groups' => [
                    ['name' => 'Hồ sơ Hợp đồng', 'docs' => [
                        ['code' => 'tv-hd1', 'name' => 'Hợp đồng đã ký', 'required' => true],
                        ['code' => 'tv-hd2', 'name' => 'Phụ lục hợp đồng', 'required' => false],
                    ]],
                    ['name' => 'Hồ sơ Nghiệm thu', 'docs' => [
                        ['code' => 'tv-nt1', 'name' => 'BB nghiệm thu sản phẩm tư vấn', 'required' => true],
                        ['code' => 'tv-nt2', 'name' => 'Báo cáo tư vấn cuối kỳ', 'required' => true],
                    ]],
                    ['name' => 'Thanh toán', 'docs' => [
                        ['code' => 'tv-tt1', 'name' => 'Đề nghị thanh toán', 'required' => true],
                        ['code' => 'tv-tt2', 'name' => 'Xác nhận công nợ', 'required' => true],
                    ]],
                ],
            ],
            [
                'id' => 'do-luong', 'name' => 'Đo lường', 'service_type' => 'Đo lường',
                'groups' => [
                    ['name' => 'Hồ sơ Hợp đồng', 'docs' => [
                        ['code' => 'dl-hd1', 'name' => 'Hợp đồng đã ký', 'required' => true],
                    ]],
                    ['name' => 'Nghiệm thu', 'docs' => [
                        ['code' => 'dl-nt1', 'name' => 'BB đo lường hiện trường', 'required' => true],
                        ['code' => 'dl-nt2', 'name' => 'Báo cáo kết quả đo', 'required' => true],
                        ['code' => 'dl-nt3', 'name' => 'BB nghiệm thu kết quả', 'required' => true],
                    ]],
                    ['name' => 'Thanh toán', 'docs' => [
                        ['code' => 'dl-tt1', 'name' => 'Đề nghị thanh toán', 'required' => true],
                        ['code' => 'dl-tt2', 'name' => 'Xác nhận công nợ', 'required' => true],
                    ]],
                ],
            ],
            [
                'id' => 'bao-tri', 'name' => 'Bảo trì bảo dưỡng', 'service_type' => 'Bảo trì',
                'groups' => [
                    ['name' => 'Hồ sơ Hợp đồng', 'docs' => [
                        ['code' => 'bt-hd1', 'name' => 'Hợp đồng bảo trì', 'required' => true],
                    ]],
                    ['name' => 'Nghiệm thu', 'docs' => [
                        ['code' => 'bt-nt1', 'name' => 'BB bảo trì định kỳ', 'required' => true],
                        ['code' => 'bt-nt2', 'name' => 'Báo cáo bảo trì tháng', 'required' => true],
                    ]],
                    ['name' => 'Thanh toán', 'docs' => [
                        ['code' => 'bt-tt1', 'name' => 'Đề nghị thanh toán', 'required' => true],
                    ]],
                ],
            ],
        ];

        foreach ($config as $cfg) {
            $type = InvoiceType::create([
                'id' => $cfg['id'], 'name' => $cfg['name'],
                'service_type' => $cfg['service_type'], 'active' => true,
            ]);
            foreach ($cfg['groups'] as $gi => $g) {
                $group = DocumentGroup::create([
                    'invoice_type_id' => $type->id,
                    'name' => $g['name'],
                    'sort_order' => $gi,
                ]);
                foreach ($g['docs'] as $di => $d) {
                    DocumentTemplate::create([
                        'document_group_id' => $group->id,
                        'code' => $d['code'], 'name' => $d['name'],
                        'required' => $d['required'], 'sort_order' => $di,
                    ]);
                }
            }
        }
    }

    /**
     * @param array<string, User> $users
     * @return array<int, Contract>
     */
    private function seedContracts(array $users): array
    {
        $serviceTypes = ['Tư vấn', 'Đo lường', 'Lắp đặt', 'Bảo trì'];
        $departments = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'DL', 'DDL'];
        $statuses = ['Đang thực hiện', 'Đã quyết toán', 'Đã thanh lý'];
        $customers = [
            ['VNPT Hà Nội', '0100684378', '57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội'],
            ['Mobifone', '0100686209', 'MM18 Trung Hòa, Cầu Giấy, Hà Nội'],
            ['FPT Telecom', '0101778163', '17 Duy Tân, Cầu Giấy, Hà Nội'],
            ['Vietcombank', '0100112437', '198 Trần Quang Khải, Hoàn Kiếm, Hà Nội'],
            ['Samsung Electronics HCMC', '0314617985', 'Khu CNC, Quận 9, TP Hồ Chí Minh'],
            ['Vinamilk', '0300588569', '10 Tân Trào, Quận 7, TP Hồ Chí Minh'],
            ['BQLDA TP Hà Nội', '0107654321', '79 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội'],
            ['Petrolimex', '0100107564', '1 Khâm Thiên, Đống Đa, Hà Nội'],
            ['EVN HANOI', '0100101114', '69 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội'],
            ['Vietnam Airlines', '0100107518', '200 Nguyễn Sơn, Long Biên, Hà Nội'],
        ];

        $contracts = [];
        $accountantId = $users['u2']->id;

        for ($i = 0; $i < 10; $i++) {
            $id = sprintf('HD-2025-%03d', $i + 1);
            $serviceType = $serviceTypes[$i % 4];
            $department = $departments[$i % count($departments)];
            $signDate = CarbonImmutable::create(2025, ($i % 12) + 1, 13);
            [$cName, $cTax, $cAddr] = $customers[$i];

            $contract = Contract::create([
                'id' => $id,
                'contract_number' => ($i + 1) . '/2025/HĐKT-VTK',
                'customer_name' => $cName,
                'customer_tax_code' => $cTax,
                'customer_address' => $cAddr,
                'service_type' => $serviceType,
                'sign_date' => $signDate,
                'total_value' => 500_000_000 + ($i * 250_000_000),
                'currency' => 'VND',
                'department' => $department,
                'status' => $statuses[$i % 3],
                'created_by_id' => $accountantId,
            ]);

            // Inherit docs: pick 3-6 templates from this service_type and create fake contract_documents
            $type = InvoiceType::where('service_type', $serviceType)->with('documentGroups.templates')->first();
            $docCount = 0;
            foreach ($type->documentGroups as $group) {
                foreach ($group->templates as $tpl) {
                    if ($docCount >= 4 + ($i % 3)) break 2;
                    ContractDocument::create([
                        'id' => 'doc-' . $i . '-' . $docCount,
                        'contract_id' => $contract->id,
                        'name' => $tpl->name,
                        'group_name' => $group->name,
                        'file_name' => Str::slug($tpl->name, '_') . '_' . $i . '.pdf',
                        'file_path' => 'contracts/' . $contract->id . '/' . Str::ulid() . '.pdf',
                        'mime' => 'application/pdf',
                        'size' => random_int(50_000, 2_000_000),
                        'uploaded_by_id' => $accountantId,
                        'upload_date' => $signDate->addMonth(),
                    ]);
                    $docCount++;
                }
            }

            $contracts[] = $contract;
        }
        return $contracts;
    }

    /**
     * @param array<string, User> $users
     * @param array<int, Contract> $contracts
     */
    private function seedRequests(array $users, array $contracts): void
    {
        $today = CarbonImmutable::today();
        $userPool = array_values($users);

        // Status distribution (15 total): 2 Nháp, 3 Chờ duyệt, 4 Đã duyệt, 4 Đã xuất HĐ, 1 Từ chối, 1 Trả lại bổ sung
        $statusPlan = array_merge(
            array_fill(0, 2, 'Nháp'),
            array_fill(0, 3, 'Chờ duyệt'),
            array_fill(0, 4, 'Đã duyệt'),
            array_fill(0, 4, 'Đã xuất HĐ'),
            ['Từ chối', 'Trả lại bổ sung'],
        );

        foreach ($statusPlan as $i => $status) {
            $contract = $contracts[$i % count($contracts)];
            $valueBeforeVat = 500_000_000 + ($i * 137_000_000);
            $vatRate = [10, 8, 10, 0, 5][$i % 5];
            $vatAmount = (int) round($valueBeforeVat * $vatRate / 100);
            $createdBy = $userPool[$i % count($userPool)];

            // Commitment edge cases:
            // i=0 -> commitment overdue (deadline in past) → triggers commitmentOverdue
            // i=1 -> commitment due soon (deadline today+2) → triggers legalDueSoon
            $hasCommitment = $i < 4;
            $commitmentDeadline = match (true) {
                $i === 0 => $today->subDays(5),
                $i === 1 => $today->addDays(2),
                $i === 2 => $today->addMonth(),
                $i === 3 => $today->addMonths(2),
                default => null,
            };

            $invoiceKindOptions = ['Tạo mới', 'Điều chỉnh', 'Thay thế'];
            $invoiceKind = $invoiceKindOptions[$i % 3];
            $needsAdj = $invoiceKind !== 'Tạo mới';

            $createdDate = $today->subDays(60 - $i * 3);
            $id = sprintf('DN-%04d-%05d', $createdDate->year, 101 + $i);

            $req = Request::create([
                'id' => $id,
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'customer_name' => $contract->customer_name,
                'customer_tax_code' => $contract->customer_tax_code,
                'customer_address' => $contract->customer_address,
                'service_type' => $contract->service_type,
                'department' => $contract->department,
                'value_before_vat' => $valueBeforeVat,
                'vat_rate' => $vatRate,
                'vat_amount' => $vatAmount,
                'value_after_vat' => $valueBeforeVat + $vatAmount,
                'payment_term' => ['Đợt 1', 'Đợt 2', 'Thanh toán cuối'][$i % 3],
                'payment_method' => 'Chuyển khoản',
                'invoice_type' => $invoiceKind,
                'original_invoice_number' => $needsAdj ? sprintf('K25TYY%07d', 1000 + $i) : null,
                'adjustment_reason' => $needsAdj ? 'Điều chỉnh sai sót thông tin người mua' : null,
                'buyer_email' => 'ketoan@' . Str::slug(explode(' ', $contract->customer_name)[0]) . '.vn',
                'status' => $status,
                'has_commitment' => $hasCommitment,
                'commitment_text' => $hasCommitment ? 'Cam kết bổ sung hồ sơ pháp lý trong thời hạn quy định.' : null,
                'commitment_deadline' => $commitmentDeadline,
                'created_by_id' => $createdBy->id,
                'submitted_at' => in_array($status, ['Chờ duyệt', 'Đã duyệt', 'Đã xuất HĐ', 'Từ chối', 'Trả lại bổ sung'])
                    ? $createdDate->addDays(1) : null,
            ]);

            // Inherit request_documents from contract documents (match by name)
            $contractDocsByName = $contract->documents->keyBy(fn ($d) => mb_strtolower(trim($d->name)));
            $type = InvoiceType::where('service_type', $contract->service_type)->with('documentGroups.templates')->first();
            $checkedCount = 0;
            $totalCount = 0;
            foreach ($type->documentGroups as $group) {
                foreach ($group->templates as $tpl) {
                    $totalCount++;
                    $matchKey = mb_strtolower(trim($tpl->name));
                    $contractDoc = $contractDocsByName->get($matchKey);
                    $checked = $contractDoc !== null;
                    if ($checked) $checkedCount++;
                    RequestDocument::create([
                        'request_id' => $req->id,
                        'name' => $tpl->name,
                        'file_name' => $contractDoc?->file_name,
                        'file_path' => $contractDoc?->file_path,
                        'checked' => $checked,
                        'inherited_from_contract_doc_id' => $contractDoc?->id,
                        'uploaded_at' => $contractDoc ? $createdDate : null,
                    ]);
                }
            }

            // Approval row for approved/exported/(rejected/returned have rejection rows instead)
            if (in_array($status, ['Đã duyệt', 'Đã xuất HĐ'], true)) {
                Approval::create([
                    'request_id' => $req->id,
                    'approved_by_id' => $users['u2']->id,
                    'approved_at' => $createdDate->addDays(3),
                    'accounting_ref_no' => sprintf('PT-%04d-%05d', $today->year, 500 + $i),
                    'account_revenue' => '5113',
                    'account_tax' => '33311',
                    'account_receivable' => '131',
                    'approval_note' => null,
                    'signature_snapshot' => [
                        'name' => $users['u2']->name,
                        'role_label' => 'Kế toán',
                        'department' => 'TC',
                        'timestamp' => $createdDate->addDays(3)->toIso8601String(),
                    ],
                ]);
            }
            if ($status === 'Từ chối') {
                Rejection::create([
                    'request_id' => $req->id, 'kind' => 'reject',
                    'reason' => 'Thông tin khách hàng không khớp giữa hợp đồng và đề nghị.',
                    'by_id' => $users['u2']->id, 'at' => $createdDate->addDays(2),
                ]);
            }
            if ($status === 'Trả lại bổ sung') {
                Rejection::create([
                    'request_id' => $req->id, 'kind' => 'return',
                    'reason' => 'Đề nghị bổ sung biên bản nghiệm thu hoàn thành.',
                    'by_id' => $users['u2']->id, 'at' => $createdDate->addDays(2),
                ]);
            }
            // S-Invoice for exported requests
            if ($status === 'Đã xuất HĐ') {
                $isError = $i === 10; // i=10 falls inside Đã xuất HĐ block (i=9..12) — provides Lỗi for retry-flow tests // Make one of the exported requests an error (for retry flow)
                SInvoice::create([
                    'request_id' => $req->id,
                    's_invoice_number' => $isError ? null : sprintf('K26TYY%07d', 100 + $i * 7),
                    's_invoice_tax_code' => $isError ? null : sprintf('4A2B%04d', 1000 + $i),
                    'status' => $isError ? 'Lỗi' : 'Thành công',
                    'error_message' => $isError ? 'Kết nối Viettel timeout sau 30s' : null,
                    'gateway_response_json' => $isError ? null : ['code' => 200, 'message' => 'OK'],
                    'exported_at' => $createdDate->addDays(5),
                    'last_synced_at' => $isError ? null : $createdDate->addDays(5),
                ]);
            }
        }
    }
}
