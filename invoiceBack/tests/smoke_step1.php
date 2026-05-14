<?php

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

echo PHP_EOL . '=== Table counts ===' . PHP_EOL;
echo 'users               : ' . User::count() . PHP_EOL;
echo 'invoice_types       : ' . InvoiceType::count() . PHP_EOL;
echo 'document_groups     : ' . DocumentGroup::count() . PHP_EOL;
echo 'document_templates  : ' . DocumentTemplate::count() . PHP_EOL;
echo 'contracts           : ' . Contract::count() . PHP_EOL;
echo 'contract_documents  : ' . ContractDocument::count() . PHP_EOL;
echo 'requests            : ' . Request::count() . PHP_EOL;
echo 'request_documents   : ' . RequestDocument::count() . PHP_EOL;
echo 'approvals           : ' . Approval::count() . PHP_EOL;
echo 'rejections          : ' . Rejection::count() . PHP_EOL;
echo 's_invoices          : ' . SInvoice::count() . PHP_EOL;
echo 'notification_settings: ' . NotificationSetting::count() . PHP_EOL;

echo PHP_EOL . '=== Request status distribution ===' . PHP_EOL;
foreach (Request::query()->selectRaw('status, count(*) as c')->groupBy('status')->get() as $r) {
    echo '  ' . $r->status . ': ' . $r->c . PHP_EOL;
}
$distinct = Request::query()->distinct()->pluck('status')->count();
echo 'distinct statuses: ' . $distinct . PHP_EOL;

echo PHP_EOL . '=== Sanity checks ===' . PHP_EOL;
$u = User::find(1);
echo 'user 1 code/name/email: ' . $u->code . ' / ' . $u->name . ' / ' . $u->email . PHP_EOL;
echo 's_invoice statuses: ' . SInvoice::pluck('status')->implode(', ') . PHP_EOL;
$req = Request::with('documents')->first();
echo 'first request: ' . $req->id . ' status=' . $req->status
    . ' docs=' . $req->documents->count()
    . ' inheritedDocs=' . $req->documents->whereNotNull('inherited_from_contract_doc_id')->count() . PHP_EOL;

$overdue = Request::where('has_commitment', true)
    ->whereDate('commitment_deadline', '<', now())
    ->count();
echo 'overdue commitments: ' . $overdue . PHP_EOL;

$dueSoon = Request::where('has_commitment', true)
    ->whereBetween('commitment_deadline', [now()->toDateString(), now()->addDays(3)->toDateString()])
    ->count();
echo 'due-soon commitments (≤3 days): ' . $dueSoon . PHP_EOL;

$assertions = [
    'users == 5' => User::count() === 5,
    'invoice_types == 4' => InvoiceType::count() === 4,
    'contracts == 10' => Contract::count() === 10,
    'requests == 15' => Request::count() === 15,
    'distinct request statuses == 6' => $distinct === 6,
    'notification_settings == 5*9=45' => NotificationSetting::count() === 45,
    's_invoices == 4 (one per Đã xuất HĐ)' => SInvoice::count() === 4,
    'overdue commitment ≥ 1' => $overdue >= 1,
    'due-soon commitment ≥ 1' => $dueSoon >= 1,
];

echo PHP_EOL . '=== Assertions ===' . PHP_EOL;
$ok = true;
foreach ($assertions as $label => $pass) {
    echo ($pass ? '  ✓ ' : '  ✗ ') . $label . PHP_EOL;
    $ok = $ok && $pass;
}
echo PHP_EOL . ($ok ? '*** ALL SMOKE TESTS PASS ***' : '*** FAIL ***') . PHP_EOL;
exit($ok ? 0 : 1);
