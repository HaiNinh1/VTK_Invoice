<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApprovalStep;
use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceRequestResource;
use App\Models\InvoiceRequest;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    /**
     * Pending approval queue tailored to the actor's permissions.
     */
    public function pending(Request $request)
    {
        $user = $request->user();
        $query = InvoiceRequest::query()
            ->with(['customer', 'creator', 'revenueCenter', 'invoiceType', 'serviceType']);

        if ($user->can('invoice.approve.dept') && ! $user->can('invoice.approve.accountant')) {
            $query->where('status', InvoiceStatus::Pending->value);
            if ($user->hasRole('manager')) {
                $query->where('revenue_center_id', $user->revenue_center_id);
            }
        } elseif ($user->can('invoice.approve.director')) {
            // director sees pending-vpgd where accountant already approved
            $query->where('status', InvoiceStatus::PendingVpgd->value)
                ->whereHas('approvals', function ($q) {
                    $q->where('step', ApprovalStep::Accountant->value)
                        ->where('action', 'approved');
                });
        } elseif ($user->can('invoice.approve.accountant')) {
            $query->where('status', InvoiceStatus::PendingVpgd->value)
                ->whereDoesntHave('approvals', function ($q) {
                    $q->where('step', ApprovalStep::Accountant->value)
                        ->where('action', 'approved');
                });
        } else {
            $query->whereRaw('1 = 0');
        }

        $perPage = (int) min(100, max(1, (int) $request->input('per_page', 20)));

        return InvoiceRequestResource::collection($query->latest()->paginate($perPage));
    }
}
