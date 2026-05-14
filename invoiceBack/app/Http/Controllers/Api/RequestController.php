<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RequestResource;
use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\InvoiceType;
use App\Models\Request as InvoiceRequest;
use App\Models\RequestDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * CRUD for invoice requests. State transitions live in RequestActionController.
 */
class RequestController extends Controller
{
    public const STATUSES = ['Nháp', 'Chờ duyệt', 'Đã duyệt', 'Đã xuất HĐ', 'Từ chối', 'Trả lại bổ sung'];
    public const PAYMENT_TERMS = ['Tạm ứng', 'Đợt 1', 'Đợt 2', 'Đợt 3', 'Thanh toán cuối', '1 lần'];
    public const PAYMENT_METHODS = ['Chuyển khoản', 'Tiền mặt', 'Bù trừ'];
    public const INVOICE_TYPES = ['Tạo mới', 'Điều chỉnh', 'Thay thế'];
    public const VAT_RATES = [0, 5, 8, 10];

    public function index(HttpRequest $request): JsonResponse
    {
        $this->authorize('viewAny', InvoiceRequest::class);

        $user = $request->user();
        $query = InvoiceRequest::query()
            ->with(['creator', 'approval.approver', 'sInvoice'])
            ->orderByDesc('created_at');

        // Department/role scoping mirrors DeNghi.jsx exactly.
        if ($user->canSeeAllDepartments()) {
            // no scope
        } elseif ($user->role === 'manager') {
            $query->where('department', $user->department);
        } else {
            $query->where('created_by_id', $user->id);
        }

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($w) use ($q): void {
                $w->where('id', 'like', "%{$q}%")
                  ->orWhere('contract_number', 'like', "%{$q}%")
                  ->orWhere('customer_name', 'like', "%{$q}%");
            });
        }

        if ($status = $request->query('status')) {
            if ($status !== 'Tất cả') {
                $query->where('status', $status);
            }
        }

        if ($dept = $request->query('department')) {
            if ($dept !== 'Tất cả') {
                $query->where('department', $dept);
            }
        }

        return RequestResource::collection($query->get())->response();
    }

    public function show(InvoiceRequest $request): JsonResponse
    {
        $this->authorize('view', $request);
        $request->load(['creator', 'approval.approver', 'sInvoice', 'documents']);

        return (new RequestResource($request))->response();
    }

    public function store(HttpRequest $request): JsonResponse
    {
        $this->authorize('create', InvoiceRequest::class);

        $data = $this->validatePayload($request, isCreate: true);
        $user = $request->user();

        return DB::transaction(function () use ($data, $user) {
            $contract = Contract::findOrFail($data['contractId']);

            $valueBeforeVAT = (int) ($data['valueBeforeVAT'] ?? 0);
            $vatRate = (int) ($data['vatRate'] ?? 10);
            $vatAmount = (int) round($valueBeforeVAT * $vatRate / 100);

            $req = InvoiceRequest::create([
                'id' => $this->nextRequestId(),
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'customer_name' => $contract->customer_name,
                'customer_tax_code' => $contract->customer_tax_code,
                'customer_address' => $contract->customer_address,
                'service_type' => $contract->service_type,
                'department' => $contract->department,
                'value_before_vat' => $valueBeforeVAT,
                'vat_rate' => $vatRate,
                'vat_amount' => $vatAmount,
                'value_after_vat' => $valueBeforeVAT + $vatAmount,
                'payment_term' => $data['paymentTerm'],
                'payment_method' => $data['paymentMethod'] ?? 'Chuyển khoản',
                'invoice_type' => $data['invoiceType'] ?? 'Tạo mới',
                'original_invoice_number' => $data['originalInvoiceNumber'] ?? null,
                'adjustment_reason' => $data['adjustmentReason'] ?? null,
                'buyer_email' => $data['buyerEmail'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => $data['status'] ?? 'Nháp',
                'has_commitment' => (bool) ($data['hasCommitment'] ?? false),
                'commitment_text' => $data['commitmentText'] ?? null,
                'commitment_deadline' => $data['commitmentDeadline'] ?? null,
                'legal_total' => (int) ($data['legalChecklist']['total'] ?? 0),
                'legal_checked' => (int) ($data['legalChecklist']['checked'] ?? 0),
                'created_by_id' => $user->id,
                'submitted_at' => ($data['status'] ?? 'Nháp') === 'Chờ duyệt' ? now() : null,
            ]);

            // Auto-seed request_documents from InvoiceType + contract inheritance.
            $this->seedRequestDocuments($req, $contract);

            $req->load(['creator', 'approval.approver', 'sInvoice']);
            return (new RequestResource($req))->response()->setStatusCode(Response::HTTP_CREATED);
        });
    }

    public function update(HttpRequest $request, InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('update', $invoiceRequest);

        $data = $this->validatePayload($request, isCreate: false);

        $patch = [];
        foreach ([
            'paymentTerm' => 'payment_term',
            'paymentMethod' => 'payment_method',
            'invoiceType' => 'invoice_type',
            'originalInvoiceNumber' => 'original_invoice_number',
            'adjustmentReason' => 'adjustment_reason',
            'buyerEmail' => 'buyer_email',
            'notes' => 'notes',
            'commitmentText' => 'commitment_text',
            'commitmentDeadline' => 'commitment_deadline',
        ] as $apiKey => $col) {
            if (array_key_exists($apiKey, $data)) {
                $patch[$col] = $data[$apiKey];
            }
        }
        if (array_key_exists('hasCommitment', $data)) {
            $patch['has_commitment'] = (bool) $data['hasCommitment'];
        }
        if (array_key_exists('valueBeforeVAT', $data) || array_key_exists('vatRate', $data)) {
            $vbv = (int) ($data['valueBeforeVAT'] ?? $invoiceRequest->value_before_vat);
            $vr = (int) ($data['vatRate'] ?? $invoiceRequest->vat_rate);
            $vat = (int) round($vbv * $vr / 100);
            $patch['value_before_vat'] = $vbv;
            $patch['vat_rate'] = $vr;
            $patch['vat_amount'] = $vat;
            $patch['value_after_vat'] = $vbv + $vat;
        }
        if (array_key_exists('legalChecklist', $data)) {
            $patch['legal_total'] = (int) ($data['legalChecklist']['total'] ?? 0);
            $patch['legal_checked'] = (int) ($data['legalChecklist']['checked'] ?? 0);
        }

        $invoiceRequest->update($patch);
        $invoiceRequest->load(['creator', 'approval.approver', 'sInvoice']);

        return (new RequestResource($invoiceRequest))->response();
    }

    public function destroy(InvoiceRequest $invoiceRequest): JsonResponse
    {
        $this->authorize('delete', $invoiceRequest);
        $invoiceRequest->delete();

        return response()->json(['ok' => true]);
    }

    /** Generates DN-YYYY-NNNNN, zero-padded per FE format. */
    private function nextRequestId(): string
    {
        $year = now()->year;
        $prefix = "DN-{$year}-";
        $last = InvoiceRequest::where('id', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('id');
        $n = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;
        return $prefix.str_pad((string) $n, 5, '0', STR_PAD_LEFT);
    }

    private function validatePayload(HttpRequest $request, bool $isCreate): array
    {
        $rules = [
            'contractId' => [$isCreate ? 'required' : 'sometimes', 'string', 'exists:contracts,id'],
            'valueBeforeVAT' => ['sometimes', 'numeric', 'min:0'],
            'vatRate' => ['sometimes', Rule::in(self::VAT_RATES)],
            'paymentTerm' => [$isCreate ? 'required' : 'sometimes', Rule::in(self::PAYMENT_TERMS)],
            'paymentMethod' => ['sometimes', 'nullable', Rule::in(self::PAYMENT_METHODS)],
            'invoiceType' => ['sometimes', Rule::in(self::INVOICE_TYPES)],
            'originalInvoiceNumber' => ['nullable', 'string', 'max:60'],
            'adjustmentReason' => ['nullable', 'string'],
            'buyerEmail' => ['nullable', 'email'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['Nháp', 'Chờ duyệt'])],
            'hasCommitment' => ['sometimes', 'boolean'],
            'commitmentText' => ['nullable', 'string'],
            'commitmentDeadline' => ['nullable', 'date'],
            'legalChecklist' => ['sometimes', 'array'],
            'legalChecklist.total' => ['sometimes', 'integer', 'min:0'],
            'legalChecklist.checked' => ['sometimes', 'integer', 'min:0'],
        ];

        $data = $request->validate($rules);

        // FE rule: Điều chỉnh/Thay thế require originalInvoiceNumber + adjustmentReason.
        $kind = $data['invoiceType'] ?? null;
        if (in_array($kind, ['Điều chỉnh', 'Thay thế'], true)) {
            $request->validate([
                'originalInvoiceNumber' => ['required', 'string', 'max:60'],
                'adjustmentReason' => ['required', 'string'],
            ], [
                'originalInvoiceNumber.required' => 'Vui lòng nhập Số HĐ gốc và Lý do cho loại Điều chỉnh/Thay thế',
                'adjustmentReason.required' => 'Vui lòng nhập Số HĐ gốc và Lý do cho loại Điều chỉnh/Thay thế',
            ]);
        }

        return $data;
    }

    /**
     * Populate request_documents from the contract's InvoiceType config and
     * inherit any contract documents that share a normalized name.
     */
    private function seedRequestDocuments(InvoiceRequest $req, Contract $contract): void
    {
        $type = InvoiceType::where('service_type', $contract->service_type)
            ->with('documentGroups.templates')
            ->first();
        if (! $type) {
            return;
        }
        $contractDocs = ContractDocument::where('contract_id', $contract->id)->get();
        $byName = $contractDocs->keyBy(fn ($d) => mb_strtolower(trim($d->name)));

        foreach ($type->documentGroups as $group) {
            foreach ($group->templates as $tpl) {
                $key = mb_strtolower(trim($tpl->name));
                $inherited = $byName->get($key);
                RequestDocument::create([
                    'request_id' => $req->id,
                    'name' => $tpl->name,
                    'file_path' => $inherited?->file_path,
                    'file_name' => $inherited?->file_name,
                    'checked' => $inherited !== null,
                    'inherited_from_contract_doc_id' => $inherited?->id,
                    'uploaded_at' => $inherited?->upload_date,
                ]);
            }
        }
    }
}
