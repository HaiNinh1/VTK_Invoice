<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Models\Request as InvoiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContractController extends Controller
{
    public const STATUSES = ['Đang thực hiện', 'Đã quyết toán', 'Đã thanh lý'];

    public const DEPARTMENTS = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'DL', 'DDL', 'TC', 'IT'];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorize('viewAny', Contract::class);

        $q = Contract::query()->with('documents');

        // Scope by department for employee/manager.
        if (! $user->canSeeAllDepartments()) {
            $q->where('department', $user->department);
        }

        if ($s = trim((string) $request->query('q', ''))) {
            $q->where(function ($w) use ($s): void {
                $w->where('contract_number', 'like', "%{$s}%")
                  ->orWhere('customer_name', 'like', "%{$s}%")
                  ->orWhere('id', 'like', "%{$s}%");
            });
        }

        if (($status = $request->query('status')) && $status !== 'Tất cả') {
            $q->where('status', $status);
        }

        $rows = $q->orderByDesc('sign_date')->orderByDesc('id')->get();

        return response()->json([
            'data' => ContractResource::collection($rows)->resolve(),
        ]);
    }

    public function show(Request $request, Contract $contract): JsonResponse
    {
        $this->authorize('view', $contract);
        $contract->load('documents');

        return response()->json(['data' => (new ContractResource($contract))->resolve($request)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Contract::class);
        $data = $this->validatePayload($request);

        // Uniqueness of contract_number.
        if (Contract::query()->where('contract_number', $data['contractNumber'])->exists()) {
            return response()->json([
                'message' => 'Số hợp đồng đã tồn tại',
                'errors' => ['contractNumber' => ['Số hợp đồng đã tồn tại']],
            ], 422);
        }

        $id = $this->nextContractId((int) date('Y'));
        $contract = DB::transaction(function () use ($id, $data, $request) {
            return Contract::create([
                'id' => $id,
                'contract_number' => $data['contractNumber'],
                'customer_name' => $data['customerName'],
                'customer_tax_code' => $data['customerTaxCode'],
                'customer_address' => $data['customerAddress'] ?? null,
                'customer_representative' => $data['customerRepresentative'] ?? null,
                'customer_email' => $data['customerEmail'] ?? null,
                'customer_phone' => $data['customerPhone'] ?? null,
                'service_type' => $data['serviceType'],
                'sign_date' => $data['signDate'],
                'total_value' => $data['totalValue'],
                'currency' => $data['currency'] ?? 'VND',
                'department' => $data['department'],
                'status' => $data['status'] ?? 'Đang thực hiện',
                'notes' => $data['notes'] ?? null,
                'created_by_id' => $request->user()->id,
            ]);
        });

        $contract->load('documents');
        return response()->json(['data' => (new ContractResource($contract))->resolve($request)], 201);
    }

    public function update(Request $request, Contract $contract): JsonResponse
    {
        $this->authorize('update', $contract);
        $data = $this->validatePayload($request, $contract->id);

        if (Contract::query()
            ->where('contract_number', $data['contractNumber'])
            ->where('id', '!=', $contract->id)
            ->exists()
        ) {
            return response()->json([
                'message' => 'Số hợp đồng đã tồn tại',
                'errors' => ['contractNumber' => ['Số hợp đồng đã tồn tại']],
            ], 422);
        }

        $contract->update([
            'contract_number' => $data['contractNumber'],
            'customer_name' => $data['customerName'],
            'customer_tax_code' => $data['customerTaxCode'],
            'customer_address' => $data['customerAddress'] ?? null,
            'customer_representative' => $data['customerRepresentative'] ?? null,
            'customer_email' => $data['customerEmail'] ?? null,
            'customer_phone' => $data['customerPhone'] ?? null,
            'service_type' => $data['serviceType'],
            'sign_date' => $data['signDate'],
            'total_value' => $data['totalValue'],
            'currency' => $data['currency'] ?? 'VND',
            'department' => $data['department'],
            'status' => $data['status'] ?? $contract->status,
            'notes' => $data['notes'] ?? null,
        ]);

        $contract->load('documents');
        return response()->json(['data' => (new ContractResource($contract))->resolve($request)]);
    }

    public function destroy(Request $request, Contract $contract): JsonResponse
    {
        $this->authorize('delete', $contract);

        // Block delete if any linked request exists (matches FE detail-page guard).
        $hasLinked = InvoiceRequest::query()->where('contract_id', $contract->id)->exists();
        if ($hasLinked) {
            return response()->json([
                'ok' => false,
                'reason' => 'Không thể xóa - đã có đề nghị xuất HĐ liên quan',
            ], 422);
        }

        $contract->delete();
        return response()->json(['ok' => true]);
    }

    private function validatePayload(Request $request, ?string $existingId = null): array
    {
        return $request->validate([
            'contractNumber' => ['required', 'string', 'max:60'],
            'customerName' => ['required', 'string', 'max:200'],
            'customerTaxCode' => ['required', 'string', 'regex:/^\d{10}$|^\d{13}$/'],
            'customerAddress' => ['nullable', 'string'],
            'customerRepresentative' => ['nullable', 'string', 'max:200'],
            'customerEmail' => ['nullable', 'email', 'max:200'],
            'customerPhone' => ['nullable', 'string', 'max:30'],
            'serviceType' => ['required', 'string', 'max:60'],
            'signDate' => ['required', 'date'],
            'totalValue' => ['required', 'numeric', 'gt:0'],
            'currency' => ['nullable', 'in:VND,USD'],
            'department' => ['required', 'in:'.implode(',', self::DEPARTMENTS)],
            'status' => ['nullable', 'in:'.implode(',', self::STATUSES)],
            'notes' => ['nullable', 'string'],
        ], [
            'contractNumber.required' => 'Vui lòng nhập số hợp đồng',
            'serviceType.required' => 'Chọn loại hợp đồng',
            'signDate.required' => 'Chọn ngày ký',
            'customerName.required' => 'Nhập tên CĐT',
            'customerTaxCode.required' => 'Nhập mã số thuế',
            'customerTaxCode.regex' => 'MST phải gồm 10 hoặc 13 chữ số',
            'customerAddress.required' => 'Nhập địa chỉ',
            'customerEmail.email' => 'Email không hợp lệ',
            'totalValue.gt' => 'Giá trị HĐ phải lớn hơn 0',
            'department.required' => 'Chọn trung tâm doanh thu',
        ]);
    }

    private function nextContractId(int $year): string
    {
        $prefix = sprintf('HD-%d-', $year);
        $max = Contract::query()
            ->where('id', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('id');
        $next = 1;
        if ($max) {
            $next = ((int) substr($max, strlen($prefix))) + 1;
        }
        return sprintf('%s%03d', $prefix, $next);
    }
}
