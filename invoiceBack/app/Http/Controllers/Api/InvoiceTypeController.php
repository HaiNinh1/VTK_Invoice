<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceTypeResource;
use App\Models\DocumentGroup;
use App\Models\DocumentTemplate;
use App\Models\InvoiceType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class InvoiceTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rows = InvoiceType::query()
            ->with(['documentGroups.templates'])
            ->orderBy('id')
            ->get();
        return response()->json(['data' => InvoiceTypeResource::collection($rows)->resolve()]);
    }

    public function show(Request $request, InvoiceType $invoiceType): JsonResponse
    {
        $invoiceType->load('documentGroups.templates');
        return response()->json(['data' => (new InvoiceTypeResource($invoiceType))->resolve($request)]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'serviceType' => ['required', 'string', 'max:60'],
            'active' => ['nullable', 'boolean'],
        ]);

        $id = $this->nextSlug($data['name']);
        $type = InvoiceType::create([
            'id' => $id,
            'name' => $data['name'],
            'service_type' => $data['serviceType'],
            'active' => $data['active'] ?? true,
        ]);
        DocumentGroup::create([
            'invoice_type_id' => $type->id,
            'name' => 'Hồ sơ Hợp đồng',
            'sort_order' => 1,
        ]);
        $type->load('documentGroups.templates');
        return response()->json(['data' => (new InvoiceTypeResource($type))->resolve($request)], 201);
    }

    public function update(Request $request, InvoiceType $invoiceType): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'serviceType' => ['sometimes', 'string', 'max:60'],
            'active' => ['sometimes', 'boolean'],
        ]);
        $invoiceType->update(array_filter([
            'name' => $data['name'] ?? null,
            'service_type' => $data['serviceType'] ?? null,
            'active' => array_key_exists('active', $data) ? $data['active'] : null,
        ], fn ($v) => $v !== null));
        $invoiceType->load('documentGroups.templates');
        return response()->json(['data' => (new InvoiceTypeResource($invoiceType))->resolve($request)]);
    }

    public function destroy(Request $request, InvoiceType $invoiceType): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        $invoiceType->documentGroups()->each(function (DocumentGroup $g): void {
            $g->templates()->delete();
            $g->delete();
        });
        $invoiceType->delete();
        return response()->json(['ok' => true]);
    }

    public function toggleActive(Request $request, InvoiceType $invoiceType): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        $invoiceType->update(['active' => ! $invoiceType->active]);
        return response()->json(['ok' => true, 'active' => $invoiceType->active]);
    }

    // ----- Groups -----

    public function storeGroup(Request $request, InvoiceType $invoiceType): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        $data = $request->validate([
            'groupName' => ['required', 'string', 'max:200'],
        ]);
        $sort = ((int) $invoiceType->documentGroups()->max('sort_order')) + 1;
        $group = DocumentGroup::create([
            'invoice_type_id' => $invoiceType->id,
            'name' => $data['groupName'],
            'sort_order' => $sort,
        ]);
        return response()->json(['data' => ['id' => $group->id, 'groupName' => $group->name, 'documents' => []]], 201);
    }

    public function updateGroup(Request $request, InvoiceType $invoiceType, DocumentGroup $group): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        abort_if($group->invoice_type_id !== $invoiceType->id, 404);
        $data = $request->validate(['groupName' => ['required', 'string', 'max:200']]);
        $group->update(['name' => $data['groupName']]);
        return response()->json(['ok' => true]);
    }

    public function destroyGroup(Request $request, InvoiceType $invoiceType, DocumentGroup $group): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        abort_if($group->invoice_type_id !== $invoiceType->id, 404);
        $group->templates()->delete();
        $group->delete();
        return response()->json(['ok' => true]);
    }

    // ----- Templates -----

    public function storeTemplate(Request $request, InvoiceType $invoiceType, DocumentGroup $group): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        abort_if($group->invoice_type_id !== $invoiceType->id, 404);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'required' => ['nullable', 'boolean'],
            'code' => ['nullable', 'string', 'max:60'],
        ]);
        $sort = ((int) $group->templates()->max('sort_order')) + 1;
        $tpl = DocumentTemplate::create([
            'document_group_id' => $group->id,
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'required' => $data['required'] ?? true,
            'sort_order' => $sort,
        ]);
        return response()->json(['data' => [
            'id' => $tpl->code ?: (string) $tpl->id,
            '_id' => $tpl->id,
            'name' => $tpl->name,
            'required' => (bool) $tpl->required,
        ]], 201);
    }

    public function updateTemplate(Request $request, DocumentTemplate $template): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'required' => ['sometimes', 'boolean'],
        ]);
        $template->update(array_filter([
            'name' => $data['name'] ?? null,
            'required' => array_key_exists('required', $data) ? $data['required'] : null,
        ], fn ($v) => $v !== null));
        return response()->json(['ok' => true]);
    }

    public function destroyTemplate(Request $request, DocumentTemplate $template): JsonResponse
    {
        Gate::authorize('manage', InvoiceType::class);
        $template->delete();
        return response()->json(['ok' => true]);
    }

    private function nextSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'loai-hd';
        if (! InvoiceType::where('id', $base)->exists()) {
            return $base;
        }
        $n = 2;
        while (InvoiceType::where('id', "{$base}-{$n}")->exists()) {
            $n++;
        }
        return "{$base}-{$n}";
    }
}
