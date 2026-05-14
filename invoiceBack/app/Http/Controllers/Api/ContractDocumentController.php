<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContractDocumentResource;
use App\Models\Contract;
use App\Models\ContractDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContractDocumentController extends Controller
{
    public function store(Request $request, Contract $contract): JsonResponse
    {
        $this->authorize('update', $contract);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'group' => ['required', 'string', 'max:200'],
            'fileName' => ['nullable', 'string', 'max:255'],
            'uploadDate' => ['nullable', 'date'],
            'file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,png,jpg,jpeg,doc,docx,xls,xlsx'],
        ]);

        $filePath = null;
        $mime = null;
        $size = null;
        $fileName = $data['fileName'] ?? null;

        if ($request->hasFile('file')) {
            $f = $request->file('file');
            $filePath = $f->store('contracts/'.$contract->id, 'public');
            $mime = $f->getClientMimeType();
            $size = $f->getSize();
            $fileName = $fileName ?: $f->getClientOriginalName();
        }
        if (! $fileName) {
            $safe = Str::slug(mb_strtolower($data['name']), '_');
            $fileName = $safe.'_'.time().'.pdf';
        }

        $doc = ContractDocument::create([
            'id' => 'doc-'.$contract->id.'-'.time().'-'.random_int(100, 999),
            'contract_id' => $contract->id,
            'name' => $data['name'],
            'group_name' => $data['group'],
            'file_name' => $fileName,
            'file_path' => $filePath,
            'mime' => $mime,
            'size' => $size,
            'uploaded_by_id' => $request->user()->id,
            'upload_date' => $data['uploadDate'] ?? now()->toDateString(),
        ]);

        return response()->json([
            'data' => (new ContractDocumentResource($doc))->resolve($request),
        ], 201);
    }

    public function destroy(Request $request, Contract $contract, string $document): JsonResponse
    {
        $this->authorize('update', $contract);
        $doc = ContractDocument::query()
            ->where('contract_id', $contract->id)
            ->where('id', $document)
            ->firstOrFail();
        $doc->delete();
        return response()->json(['ok' => true]);
    }
}
