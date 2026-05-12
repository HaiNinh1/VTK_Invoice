<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLegalDocumentRequest;
use App\Http\Requests\UpdateLegalDocumentRequest;
use App\Http\Resources\LegalDocumentResource;
use App\Models\InvoiceRequestDocument;
use App\Models\LegalDocument;
use Illuminate\Http\Request;

class LegalDocumentController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', LegalDocument::class);

        $query = LegalDocument::query()->latest();

        if ($group = $request->input('group')) {
            $query->where('group', $group);
        }

        if ($request->has('enabled')) {
            $query->where('enabled', $request->boolean('enabled'));
        }

        return LegalDocumentResource::collection($query->get());
    }

    public function store(StoreLegalDocumentRequest $request)
    {
        $this->authorize('create', LegalDocument::class);

        return (new LegalDocumentResource(LegalDocument::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(LegalDocument $legalDocument): LegalDocumentResource
    {
        $this->authorize('view', $legalDocument);

        return new LegalDocumentResource($legalDocument);
    }

    public function update(UpdateLegalDocumentRequest $request, LegalDocument $legalDocument): LegalDocumentResource
    {
        $this->authorize('update', $legalDocument);

        $legalDocument->update($request->validated());

        return new LegalDocumentResource($legalDocument->refresh());
    }

    public function destroy(LegalDocument $legalDocument)
    {
        $this->authorize('delete', $legalDocument);

        $inUse = $legalDocument->invoiceTypes()->exists()
            || InvoiceRequestDocument::query()->where('legal_document_id', $legalDocument->id)->exists();

        if ($inUse) {
            return response()->json(['message' => 'Legal document is in use.'], 409);
        }

        $legalDocument->delete();

        return response()->noContent();
    }
}
