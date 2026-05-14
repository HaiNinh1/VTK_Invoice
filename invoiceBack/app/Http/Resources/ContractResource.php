<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $documents = $this->whenLoaded('documents');
        $documentsArr = $documents instanceof \Illuminate\Support\Collection
            ? ContractDocumentResource::collection($documents)->resolve()
            : [];

        return [
            'id' => $this->id,
            'contractNumber' => $this->contract_number,
            'customerName' => $this->customer_name,
            'customerTaxCode' => $this->customer_tax_code,
            'customerAddress' => $this->customer_address,
            'customerRepresentative' => $this->customer_representative,
            'customerEmail' => $this->customer_email,
            'customerPhone' => $this->customer_phone,
            'serviceType' => $this->service_type,
            'signDate' => optional($this->sign_date)->toDateString(),
            'totalValue' => (float) $this->total_value,
            'currency' => $this->currency,
            'department' => $this->department,
            'status' => $this->status,
            'notes' => $this->notes,
            'createdById' => $this->created_by_id ? 'u'.$this->created_by_id : null,
            'documents' => $documentsArr,
            'totalDocs' => $this->totalDocsForServiceType(),
            'uploadedCount' => $documents instanceof \Illuminate\Support\Collection ? $documents->count() : 0,
        ];
    }

    private function totalDocsForServiceType(): int
    {
        // Sum of all templates across groups for the matching invoice_type (by service_type).
        $type = \App\Models\InvoiceType::query()
            ->where('service_type', $this->service_type)
            ->with('documentGroups.templates')
            ->first();
        if (! $type) {
            return 0;
        }
        $count = 0;
        foreach ($type->documentGroups as $group) {
            $count += $group->templates->count();
        }
        return $count;
    }
}
