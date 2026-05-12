<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceRequestLegalDocumentResource;
use App\Models\InvoiceRequest;
use App\Models\InvoiceRequestLegalDocument;
use App\Services\LegalComplianceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class InvoiceRequestLegalDocumentController extends Controller
{
    public function __construct(protected LegalComplianceService $compliance) {}

    public function index(InvoiceRequest $invoiceRequest)
    {
        $this->authorize('view', $invoiceRequest);

        return InvoiceRequestLegalDocumentResource::collection(
            $invoiceRequest->legalDocuments()->latest('created_at')->get()
        );
    }

    public function store(Request $request, InvoiceRequest $invoiceRequest): InvoiceRequestLegalDocumentResource
    {
        $this->authorize('update', $invoiceRequest);

        $validated = $request->validate([
            'document_type' => ['required', 'string', 'max:100'],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx', 'max:10240'],
        ]);

        $file = $validated['file'];
        $path = $file->store("legal-docs/{$invoiceRequest->id}", 'local');

        $document = InvoiceRequestLegalDocument::create([
            'invoice_request_id' => $invoiceRequest->id,
            'document_type' => $validated['document_type'],
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'uploaded_by_id' => $request->user()->id,
            'created_at' => now(),
        ]);

        // Recompute legal compliance for the parent invoice request so that
        // `legal_status_cache` and `legal_complete` stay in sync with uploads.
        $this->compliance->refresh($invoiceRequest);

        return new InvoiceRequestLegalDocumentResource($document);
    }

    public function destroy(InvoiceRequest $invoiceRequest, InvoiceRequestLegalDocument $document)
    {
        $this->authorize('update', $invoiceRequest);
        abort_unless($document->invoice_request_id === $invoiceRequest->id, 404);

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        // Recompute compliance after deletion so missing docs flip status back.
        $this->compliance->refresh($invoiceRequest);

        return response()->noContent();
    }
}
