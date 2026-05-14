<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Mirrors the FE request shape from RequestsContext.jsx so the existing
 * /de-nghi pages can consume API output verbatim.
 */
class RequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $approval = $this->approval;
        $sInvoice = $this->sInvoice;
        $creator = $this->creator;

        return [
            'id' => $this->id,
            'contractId' => $this->contract_id,
            'contractNumber' => $this->contract_number,
            'customerName' => $this->customer_name,
            'customerTaxCode' => $this->customer_tax_code,
            'customerAddress' => $this->customer_address,
            'serviceType' => $this->service_type,
            'department' => $this->department,
            'valueBeforeVAT' => (float) $this->value_before_vat,
            'vatRate' => (int) $this->vat_rate,
            'vatAmount' => (float) $this->vat_amount,
            'valueAfterVAT' => (float) $this->value_after_vat,
            'paymentTerm' => $this->payment_term,
            'paymentMethod' => $this->payment_method,
            'invoiceType' => $this->invoice_type,
            'originalInvoiceNumber' => $this->original_invoice_number,
            'adjustmentReason' => $this->adjustment_reason,
            'buyerEmail' => $this->buyer_email,
            'notes' => $this->notes,
            'status' => $this->status,
            'legalChecklist' => [
                'total' => (int) $this->legal_total,
                'checked' => (int) $this->legal_checked,
            ],
            'hasCommitment' => (bool) $this->has_commitment,
            'commitmentText' => $this->commitment_text,
            'commitmentDeadline' => optional($this->commitment_deadline)->toDateString(),
            'createdBy' => $creator?->name,
            'createdById' => $creator ? 'u'.$creator->id : null,
            'createdDate' => optional($this->created_at)->toDateString(),
            'submittedAt' => optional($this->submitted_at)->toIso8601String(),
            'recalledAt' => optional($this->recalled_at)->toIso8601String(),
            // Approval snapshot — FE expects these on the request object.
            'approvedBy' => $approval?->approver?->name,
            'approvedById' => $approval?->approved_by_id ? 'u'.$approval->approved_by_id : null,
            'approvedDate' => optional($approval?->approved_at)->toDateString(),
            'accountingRefNo' => $approval?->accounting_ref_no,
            'accountRevenue' => $approval?->account_revenue,
            'accountTax' => $approval?->account_tax,
            'accountReceivable' => $approval?->account_receivable,
            'approvalNote' => $approval?->approval_note,
            // Reject/return reasons (cached on request row).
            'rejectReason' => $this->reject_reason,
            'returnReason' => $this->return_reason,
            // S-Invoice snapshot (Step 6 populates fully).
            'sInvoiceNumber' => $sInvoice?->s_invoice_number,
            'sInvoiceTaxCode' => $sInvoice?->s_invoice_tax_code,
            'sInvoiceStatus' => $sInvoice?->status,
            'sInvoiceError' => $sInvoice?->error_message,
            'exportedAt' => optional($sInvoice?->exported_at)->toIso8601String(),
        ];
    }
}
